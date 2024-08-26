import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        navigation.replace('Home');
      }
    };
    checkLoggedIn();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Please enter both username and password');
      return;
    }

    setLoading(true);
    fetch('https://dummyjson.com/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username, // e.g., 'emilys'
        password, // e.g., 'emilyspass'
      }),
    })
      .then(res => res.json())
      .then(async data => {
        console.log("RES", data);
        
        if (data.token) {
          await AsyncStorage.setItem('token', data.token);
          navigation.replace('Attendance');
        } else {
          Alert.alert('Login failed', 'Invalid username or password');
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error during login:', error);
        Alert.alert('Login failed', 'Something went wrong');
        setLoading(false);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholderTextColor={"grey"}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        placeholderTextColor={"grey"}
        secureTextEntry
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: "black"
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
    color: "grey"
  },
});

export default LoginScreen;
