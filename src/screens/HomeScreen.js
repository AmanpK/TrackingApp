import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import MapView, {Marker, Polyline} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const dealerLocations = [
  {id: 1, latitude: 28.50573, longitude: 77.41006, name: 'Dealer 1'},
  {id: 2, latitude: 28.507681, longitude: 77.409081, name: 'Dealer 2'},
];

const HomeScreen = ({navigation}) => {
  const [location, setLocation] = useState(null);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [path, setPath] = useState([]);
  const [checkedInDealers, setCheckedInDealers] = useState(new Set());
  const watchId = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        const storedCheckInTime = await AsyncStorage.getItem('checkInTime');
        const storedCheckOutTime = await AsyncStorage.getItem('checkOutTime');
        if (storedCheckInTime) {
          setCheckInTime(storedCheckInTime);
        }
        if (storedCheckOutTime) {
          setCheckOutTime(storedCheckOutTime);
        }
      } catch (error) {
        console.error('Error reading attendance data:', error);
      }
    };

    loadAttendanceData();
  }, []);

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'We need your location to track your position.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Permission Denied',
              'Location permission is required to continue.',
            );
            return;
          } else {
            startLocationUpdates();
          }
        } else {
          startLocationUpdates();
        }
      } catch (err) {
        console.warn('Permission request error:', err);
        Alert.alert('Error', 'Failed to request location permission.');
      }
    };

    requestLocationPermission();

    return () => {
      if (watchId.current) {
        Geolocation.clearWatch(watchId.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startLocationUpdates = () => {
    watchId.current = Geolocation.watchPosition(
      async position => {
        const {latitude, longitude} = position.coords;
        setLocation({latitude, longitude});

        const storedLocations =
          JSON.parse(await AsyncStorage.getItem('locations')) || [];
        storedLocations.push({
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        });
        await AsyncStorage.setItem(
          'locations',
          JSON.stringify(storedLocations),
        );

        setPath(
          storedLocations.map(loc => ({
            latitude: loc.latitude,
            longitude: loc.longitude,
          })),
        );

        checkForCheckIns({latitude, longitude});
      },
      error => {
        console.error('Error watching location:', error);
        Alert.alert(
          'Location Error',
          'Failed to get location. Please try again.',
        );
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 0,
        interval: 5000,
        fastestInterval: 2000,
      },
    );

    timeoutRef.current = setTimeout(function updateLocation() {
      fetchLocation();
      timeoutRef.current = setTimeout(updateLocation, 5 * 60 * 1000);
    }, 5 * 60 * 1000);
  };

  const fetchLocation = async () => {
    Geolocation.getCurrentPosition(
      async position => {
        const {latitude, longitude} = position.coords;
        setLocation({latitude, longitude});

        const storedLocations =
          JSON.parse(await AsyncStorage.getItem('locations')) || [];
        storedLocations.push({
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        });
        await AsyncStorage.setItem(
          'locations',
          JSON.stringify(storedLocations),
        );

        setPath(
          storedLocations.map(loc => ({
            latitude: loc.latitude,
            longitude: loc.longitude,
          })),
        );
      },
      error => {
        console.log('Error getting location:', error);
        Alert.alert('Location Error', 'Failed to get location.');
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const checkForCheckIns = currentLocation => {
    const updatedCheckIns = [];
    let updatedCheckedInDealers = new Set(checkedInDealers);

    dealerLocations.forEach(dealer => {
      const distance = getDistance(currentLocation, dealer);
      if (distance < 50) {
        if (!checkedInDealers.has(dealer.id)) {
          const currentTime = new Date().toISOString();
          updatedCheckIns.push({
            ...dealer,
            timestamp: currentTime,
            status: 'checkedIn',
          });
          updatedCheckedInDealers.add(dealer.id);
        }
      } else if (checkedInDealers.has(dealer.id)) {
        updatedCheckIns.push({
          ...dealer,
          status: 'moveAway',
        });
        updatedCheckedInDealers.delete(dealer.id);
      }
    });

    setCheckIns(updatedCheckIns);
    setCheckedInDealers(updatedCheckedInDealers);
  };

  const getDistance = (loc1, loc2) => {
    const toRad = value => (value * Math.PI) / 180;
    const R = 6371e3;
    const lat1 = toRad(loc1.latitude);
    const lat2 = toRad(loc2.latitude);
    const deltaLat = toRad(loc2.latitude - loc1.latitude);
    const deltaLon = toRad(loc2.longitude - loc1.longitude);
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleCheckOut = async () => {
    try {
      const checkOutTime = new Date().toISOString();
      await AsyncStorage.setItem('checkOutTime', checkOutTime);
      await AsyncStorage.removeItem('checkInTime');
      setCheckOutTime(checkOutTime);
      Alert.alert('Check-Out Successful', 'You have checked out.');
    } catch (error) {
      console.error('Error during check-out:', error);
      Alert.alert('Error', 'Failed to check out. Please try again.');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  if (!location) {
    return (
      <View style={styles.container}>
        <Text style={{color: 'black'}}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}>
        <Marker coordinate={location} title="Your Location" />
        {dealerLocations.map(dealer => (
          <Marker
            key={dealer.id}
            coordinate={{
              latitude: dealer.latitude,
              longitude: dealer.longitude,
            }}
            title={dealer.name}
            pinColor={'blue'}
          />
        ))}
        {checkIns.map((checkIn, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: checkIn.latitude,
              longitude: checkIn.longitude,
            }}
            title={`Checked in at ${checkIn.name}`}
            pinColor={'green'}
          />
        ))}
        <Polyline coordinates={path} strokeColor="#FF0000" strokeWidth={5} />
      </MapView>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {checkInTime
            ? `Clock in at: ${new Date(checkInTime).toLocaleTimeString()}`
            : 'You are not clocked in.'}
        </Text>
        <Text style={styles.infoText}>
          {checkOutTime
            ? `Clocked out at: ${new Date(checkOutTime).toLocaleTimeString()}`
            : 'You have not clocked out yet.'}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '55%',
          }}>
          <Button
            title="Clock Out"
            onPress={handleCheckOut}
            disabled={checkOutTime ? true : false}
          />
          <Button title="Logout" onPress={handleLogout} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 16,
    color: 'black',
  },
});

export default HomeScreen;
