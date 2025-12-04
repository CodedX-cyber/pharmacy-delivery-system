import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useCart } from '../utils/CartContext';

const DrugDetailScreen = ({ route, navigation }) => {
  const { drug } = route.params;
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (drug.stock_quantity === 0) {
      Alert.alert('Out of Stock', 'This drug is currently out of stock.');
      return;
    }

    addToCart(drug);
    Alert.alert('Added to Cart', `${drug.name} has been added to your cart.`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: drug.image_url || 'https://via.placeholder.com/300x300/cccccc/000000?text=No+Image' }}
          style={styles.drugImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.drugName}>{drug.name}</Text>
        
        <View style={styles.priceStockRow}>
          <Text style={styles.drugPrice}>${drug.price}</Text>
          <Text style={[
            styles.stockStatus,
            drug.stock_quantity > 0 ? styles.inStock : styles.outOfStock
          ]}>
            {drug.stock_quantity > 0 ? `In Stock (${drug.stock_quantity})` : 'Out of Stock'}
          </Text>
        </View>

        {drug.requires_prescription && (
          <View style={styles.prescriptionBadge}>
            <Text style={styles.prescriptionText}>Prescription Required</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {drug.description || 'No description available for this drug.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Product ID:</Text>
            <Text style={styles.infoValue}>#{drug.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Available Stock:</Text>
            <Text style={styles.infoValue}>{drug.stock_quantity} units</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Requires Prescription:</Text>
            <Text style={styles.infoValue}>
              {drug.requires_prescription ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.addToCartButton,
            drug.stock_quantity === 0 && styles.buttonDisabled
          ]}
          onPress={handleAddToCart}
          disabled={drug.stock_quantity === 0}
        >
          <Text style={styles.addToCartText}>
            {drug.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
  },
  drugImage: {
    width: 300,
    height: 300,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  contentContainer: {
    padding: 20,
  },
  drugName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  priceStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  drugPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007bff',
  },
  stockStatus: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  inStock: {
    color: '#28a745',
    backgroundColor: '#d4edda',
  },
  outOfStock: {
    color: '#dc3545',
    backgroundColor: '#f8d7da',
  },
  prescriptionBadge: {
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  prescriptionText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  addToCartButton: {
    backgroundColor: '#007bff',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  addToCartText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default DrugDetailScreen;
