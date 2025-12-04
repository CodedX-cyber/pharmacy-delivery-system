import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useCart } from '../utils/CartContext';
import { useAuth } from '../utils/AuthContext';
import { ordersAPI, prescriptionAPI } from '../services/api';

const CheckoutScreen = ({ navigation }) => {
  const { cart, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [prescriptionImage, setPrescriptionImage] = useState(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [requiresPrescription, setRequiresPrescription] = useState(false);

  useEffect(() => {
    // Check if any items in cart require prescription
    const hasPrescriptionItems = cart.some(item => item.requires_prescription);
    setRequiresPrescription(hasPrescriptionItems);
    
    // Set default delivery address from user profile
    if (user?.address) {
      setDeliveryAddress(user.address);
    }
  }, [cart, user]);

  const handleImagePicker = () => {
    setShowImagePicker(true);
  };

  const pickImage = (source) => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    const picker = source === 'camera' ? launchCamera : launchImageLibrary;

    picker(options, (response) => {
      setShowImagePicker(false);
      
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets[0]) {
        setPrescriptionImage({
          uri: response.assets[0].uri,
          name: response.assets[0].fileName,
          type: response.assets[0].type,
        });
      }
    });
  };

  const removePrescription = () => {
    setPrescriptionImage(null);
  };

  const validateOrder = () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return false;
    }

    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter a delivery address');
      return false;
    }

    if (requiresPrescription && !prescriptionImage) {
      Alert.alert('Error', 'Please upload a prescription for required medications');
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateOrder()) {
      return;
    }

    setLoading(true);

    try {
      let prescriptionUrl = null;

      // Upload prescription if required
      if (prescriptionImage) {
        const formData = new FormData();
        formData.append('prescription', {
          uri: prescriptionImage.uri,
          name: prescriptionImage.name,
          type: prescriptionImage.type,
        });
        formData.append('order_id', 'temp'); // Will be updated after order creation

        // Note: This is a simplified approach. In production, you might want to
        // upload the image first, get the URL, then create the order
        const prescriptionResponse = await prescriptionAPI.upload('temp', formData);
        prescriptionUrl = prescriptionResponse.data.prescription.image_url;
      }

      // Create order
      const orderData = {
        user_id: user.id,
        items: cart.map(item => ({
          drug_id: item.id,
          quantity: item.quantity,
        })),
        delivery_address: deliveryAddress.trim(),
        payment_method: paymentMethod,
      };

      const orderResponse = await ordersAPI.create(orderData);
      const order = orderResponse.data.order;

      // Update prescription with correct order ID if needed
      if (prescriptionUrl && prescriptionResponse) {
        await prescriptionAPI.upload(order.id, formData);
      }

      // Clear cart and navigate to confirmation
      clearCart();
      
      Alert.alert(
        'Order Placed Successfully!',
        `Your order #${order.id} has been placed. You will receive updates on your order status.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('OrderConfirmation', { order }),
          },
        ]
      );

    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to place order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDetails}>
        {item.quantity} x ${item.price} = ${(item.price * item.quantity).toFixed(2)}
      </Text>
      {item.requires_prescription && (
        <Text style={styles.prescriptionNote}>Prescription Required</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cart.map(renderOrderItem)}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${getCartTotal().toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <TextInput
            style={styles.textInput}
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            placeholder="Enter your delivery address"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cash' && styles.selectedOption,
            ]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Text style={styles.paymentText}>Cash on Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'card' && styles.selectedOption,
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <Text style={styles.paymentText}>Card Payment (Coming Soon)</Text>
          </TouchableOpacity>
        </View>

        {/* Prescription Upload */}
        {requiresPrescription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prescription Upload</Text>
            <Text style={styles.prescriptionMessage}>
              Some items in your cart require a prescription
            </Text>
            
            {prescriptionImage ? (
              <View style={styles.uploadedContainer}>
                <Image
                  source={{ uri: prescriptionImage.uri }}
                  style={styles.prescriptionImage}
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={removePrescription}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleImagePicker}
              >
                <Text style={styles.uploadButtonText}>Upload Prescription</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Image Source</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => pickImage('camera')}
            >
              <Text style={styles.modalButtonText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => pickImage('gallery')}
            >
              <Text style={styles.modalButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  orderItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  prescriptionNote: {
    fontSize: 12,
    color: '#ffc107',
    fontWeight: '600',
    marginTop: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#007bff',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 80,
  },
  paymentOption: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#007bff',
    backgroundColor: '#e3f2fd',
  },
  paymentText: {
    fontSize: 16,
    color: '#333',
  },
  prescriptionMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  uploadButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadedContainer: {
    alignItems: 'center',
  },
  prescriptionImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  removeButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 5,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  placeOrderButton: {
    backgroundColor: '#28a745',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  placeOrderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 30,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckoutScreen;
