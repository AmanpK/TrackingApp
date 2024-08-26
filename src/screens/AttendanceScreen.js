import React, {useState, useEffect} from 'react';
import {View, Text, Button, StyleSheet, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AttendanceScreen = ({navigation}) => {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCheckStatus = async () => {
      try {
        const checkedStatus = await AsyncStorage.getItem('attendanceChecked');
        if (checkedStatus === 'true') {
          navigation.replace('Home');
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error reading clock-in status:', error);
      }
    };
    loadCheckStatus();
  }, [navigation]);

  const handleCheck = async () => {
    try {
      const currentTime = new Date().toISOString();
      await AsyncStorage.setItem('attendanceChecked', 'true');
      await AsyncStorage.setItem('checkInTime', currentTime);

      Alert.alert(
        'Clock In',
        'You have confirmed your attendance.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.replace('Home');
            },
          },
        ],
        {cancelable: false},
      );
    } catch (error) {
      console.error('Error setting clock-in status:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{color: 'black'}}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance Confirmation</Text>
      <Button title="Clock In" onPress={handleCheck} disabled={checked} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: 'black',
  },
});

export default AttendanceScreen;
