import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { CartProvider } from './utils/CartContext';

// Import screens
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import DrugListScreen from './screens/DrugListScreen';
import DrugDetailScreen from './screens/DrugDetailScreen';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import OrderConfirmationScreen from './screens/OrderConfirmationScreen';
import OrdersListScreen from './screens/OrdersListScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import MedicalRecordsScreen from './screens/MedicalRecordsScreen';
import AppointmentsScreen from './screens/AppointmentsScreen';
import MedicalReportsScreen from './screens/MedicalReportsScreen';
import PrescriptionsScreen from './screens/PrescriptionsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main app tabs (for authenticated users)
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="MedicalRecords" 
        component={MedicalRecordsScreen}
        options={{
          tabBarLabel: 'Medical',
          tabBarIcon: () => null, // You can add icons here
        }}
      />
      <Tab.Screen 
        name="DrugList" 
        component={DrugListScreen}
        options={{
          tabBarLabel: 'Drugs',
          tabBarIcon: () => null, // You can add icons here
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersListScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: () => null, // You can add icons here
        }}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: () => null, // You can add icons here
        }}
      />
    </Tab.Navigator>
  );
};

// Auth stack
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007bff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ title: 'Sign In' }}
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen}
        options={{ title: 'Create Account' }}
      />
    </Stack.Navigator>
  );
};

// Main app stack
const AppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007bff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DrugDetail" 
        component={DrugDetailScreen}
        options={{ title: 'Drug Details' }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
      <Stack.Screen 
        name="OrderConfirmation" 
        component={OrderConfirmationScreen}
        options={{ title: 'Order Confirmation' }}
      />
      <Stack.Screen 
        name="OrderDetail" 
        component={OrderDetailScreen}
        options={{ title: 'Order Details' }}
      />
      <Stack.Screen 
        name="Appointments" 
        component={AppointmentsScreen}
        options={{ title: 'Appointments' }}
      />
      <Stack.Screen 
        name="MedicalReports" 
        component={MedicalReportsScreen}
        options={{ title: 'Medical Reports' }}
      />
      <Stack.Screen 
        name="Prescriptions" 
        component={PrescriptionsScreen}
        options={{ title: 'Prescriptions' }}
      />
    </Stack.Navigator>
  );
};

// Root component
const AppContent = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
        <StatusBar style="auto" />
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});
