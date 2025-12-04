import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { drugsAPI } from '../services/api';
import { useCart } from '../utils/CartContext';

const DrugListScreen = ({ navigation }) => {
  const [drugs, setDrugs] = useState([]);
  const [filteredDrugs, setFilteredDrugs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { addToCart, getCartItemCount } = useCart();

  useEffect(() => {
    fetchDrugs();
  }, []);

  useEffect(() => {
    // Filter drugs based on search query
    if (searchQuery.trim() === '') {
      setFilteredDrugs(drugs);
    } else {
      const filtered = drugs.filter(drug =>
        drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drug.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDrugs(filtered);
    }
  }, [searchQuery, drugs]);

  const fetchDrugs = async () => {
    try {
      const response = await drugsAPI.getAll();
      setDrugs(response.data.drugs);
      setFilteredDrugs(response.data.drugs);
    } catch (error) {
      console.error('Error fetching drugs:', error);
      Alert.alert('Error', 'Failed to load drugs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDrugs();
    setRefreshing(false);
  }, []);

  const handleAddToCart = (drug) => {
    if (drug.stock_quantity === 0) {
      Alert.alert('Out of Stock', 'This drug is currently out of stock.');
      return;
    }

    addToCart(drug);
    Alert.alert('Added to Cart', `${drug.name} has been added to your cart.`);
  };

  const handleDrugPress = (drug) => {
    navigation.navigate('DrugDetail', { drug });
  };

  const renderDrugItem = ({ item }) => (
    <TouchableOpacity
      style={styles.drugItem}
      onPress={() => handleDrugPress(item)}
    >
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/80x80/cccccc/000000?text=No+Image' }}
        style={styles.drugImage}
        resizeMode="cover"
      />
      <View style={styles.drugInfo}>
        <Text style={styles.drugName}>{item.name}</Text>
        <Text style={styles.drugDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.priceStockContainer}>
          <Text style={styles.drugPrice}>${item.price}</Text>
          <Text style={[
            styles.stockStatus,
            item.stock_quantity > 0 ? styles.inStock : styles.outOfStock
          ]}>
            {item.stock_quantity > 0 ? `In Stock (${item.stock_quantity})` : 'Out of Stock'}
          </Text>
        </View>
        {item.requires_prescription && (
          <Text style={styles.prescriptionRequired}>Prescription Required</Text>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.addToCartButton,
          item.stock_quantity === 0 && styles.buttonDisabled
        ]}
        onPress={() => handleAddToCart(item)}
        disabled={item.stock_quantity === 0}
      >
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading drugs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search drugs by name or description..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredDrugs}
        renderItem={renderDrugItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No drugs found matching your search.' : 'No drugs available.'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  listContainer: {
    padding: 15,
  },
  drugItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  drugImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  drugInfo: {
    flex: 1,
    marginLeft: 15,
  },
  drugName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  drugDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceStockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  drugPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  stockStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  inStock: {
    color: '#28a745',
  },
  outOfStock: {
    color: '#dc3545',
  },
  prescriptionRequired: {
    fontSize: 12,
    color: '#ffc107',
    fontWeight: '600',
  },
  addToCartButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  addToCartText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default DrugListScreen;
