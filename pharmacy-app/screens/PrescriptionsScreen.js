import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const PrescriptionsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [prescriptionDrugs, setPrescriptionDrugs] = useState([]);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/medical/prescriptions');
      setPrescriptions(response.data.prescriptions);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      Alert.alert('Error', 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrescriptions();
    setRefreshing(false);
  };

  const viewPrescriptionDetail = async (prescription) => {
    try {
      setSelectedPrescription(prescription);
      
      // Load prescription drugs
      const drugsResponse = await api.get(`/medical/prescriptions/${prescription.id}`);
      setPrescriptionDrugs(drugsResponse.data.drugs);
      
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error loading prescription details:', error);
      Alert.alert('Error', 'Failed to load prescription details');
    }
  };

  const orderPrescriptionDrugs = (prescription) => {
    if (!prescriptionDrugs || prescriptionDrugs.length === 0) {
      Alert.alert('Info', 'No drugs found in this prescription');
      return;
    }

    // Navigate to cart with prescription drugs
    navigation.navigate('Cart', { prescriptionDrugs });
  };

  const getPrescriptionStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'completed': return '#9E9E9E';
      case 'expired': return '#F44336';
      case 'cancelled': return '#FF9800';
      default: return '#ccc';
    }
  };

  const renderPrescriptionItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.prescriptionCard}
      onPress={() => viewPrescriptionDetail(item)}
    >
      <View style={styles.prescriptionHeader}>
        <View style={styles.prescriptionInfo}>
          <Text style={styles.prescriptionNumber}>{item.prescription_number}</Text>
          <Text style={styles.prescriptionDoctor}>Dr. {item.doctor_name}</Text>
          <Text style={styles.prescriptionSpecialization}>{item.specialization}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getPrescriptionStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.prescriptionDetails}>
        <Text style={styles.prescriptionDate}>
          Prescribed: {new Date(item.prescribed_date).toLocaleDateString()}
        </Text>
        {item.expiry_date && (
          <Text style={styles.expiryDate}>
            Expires: {new Date(item.expiry_date).toLocaleDateString()}
          </Text>
        )}
      </View>

      {item.diagnosis && (
        <Text style={styles.prescriptionDiagnosis} numberOfLines={2}>
          <Text style={styles.diagnosisLabel}>Diagnosis: </Text>
          {item.diagnosis}
        </Text>
      )}

      <View style={styles.prescriptionFooter}>
        <View style={styles.drugCountContainer}>
          <Ionicons name="medication" size={16} color="#666" />
          <Text style={styles.drugCount}>{item.drug_count} medications</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>

      {item.status === 'active' && (
        <TouchableOpacity 
          style={styles.orderButton}
          onPress={() => orderPrescriptionDrugs(item)}
        >
          <Ionicons name="cart" size={16} color="#fff" />
          <Text style={styles.orderButtonText}>Order Medications</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderPrescriptionDrug = ({ item }) => (
    <View style={styles.drugCard}>
      <View style={styles.drugHeader}>
        <Text style={styles.drugName}>{item.drug_name}</Text>
        <Text style={styles.drugDosage}>{item.dosage}</Text>
      </View>
      
      <View style={styles.drugDetails}>
        <View style={styles.drugDetailRow}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.drugDetailText}>{item.frequency}</Text>
        </View>
        <View style={styles.drugDetailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.drugDetailText}>{item.duration}</Text>
        </View>
        <View style={styles.drugDetailRow}>
          <Ionicons name="pill" size={16} color="#666" />
          <Text style={styles.drugDetailText}>Quantity: {item.quantity}</Text>
        </View>
      </View>

      {item.instructions && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <Text style={styles.instructionsText}>{item.instructions}</Text>
        </View>
      )}

      {item.drug_description && (
        <Text style={styles.drugDescription} numberOfLines={2}>
          {item.drug_description}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading prescriptions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Prescriptions</Text>
        </View>

        {prescriptions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="medication" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>No prescriptions yet</Text>
            <Text style={styles.emptyText}>Your prescriptions will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={prescriptions}
            renderItem={renderPrescriptionItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.prescriptionsList}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Prescription Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        {selectedPrescription && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Prescription Details</Text>
              <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.prescriptionTitle}>{selectedPrescription.prescription_number}</Text>
                <View style={styles.detailMeta}>
                  <Text style={styles.detailDoctor}>Dr. {selectedPrescription.doctor_name}</Text>
                  <View style={[styles.detailStatusBadge, { backgroundColor: getPrescriptionStatusColor(selectedPrescription.status) }]}>
                    <Text style={styles.detailStatusText}>{selectedPrescription.status}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <View style={styles.dateRow}>
                  <View style={styles.dateItem}>
                    <Ionicons name="calendar" size={16} color="#666" />
                    <Text style={styles.dateLabel}>Prescribed</Text>
                    <Text style={styles.dateValue}>{new Date(selectedPrescription.prescribed_date).toLocaleDateString()}</Text>
                  </View>
                  {selectedPrescription.expiry_date && (
                    <View style={styles.dateItem}>
                      <Ionicons name="alert-circle" size={16} color="#FF9800" />
                      <Text style={styles.dateLabel}>Expires</Text>
                      <Text style={styles.dateValue}>{new Date(selectedPrescription.expiry_date).toLocaleDateString()}</Text>
                    </View>
                  )}
                </View>
              </View>

              {selectedPrescription.diagnosis && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Diagnosis</Text>
                  <Text style={styles.detailText}>{selectedPrescription.diagnosis}</Text>
                </View>
              )}

              {selectedPrescription.instructions && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>General Instructions</Text>
                  <Text style={styles.detailText}>{selectedPrescription.instructions}</Text>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Medications ({prescriptionDrugs.length})</Text>
                <FlatList
                  data={prescriptionDrugs}
                  renderItem={renderPrescriptionDrug}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                />
              </View>

              {selectedPrescription.notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Additional Notes</Text>
                  <Text style={styles.detailText}>{selectedPrescription.notes}</Text>
                </View>
              )}

              {selectedPrescription.status === 'active' && prescriptionDrugs.length > 0 && (
                <View style={styles.actionSection}>
                  <TouchableOpacity 
                    style={styles.orderAllButton}
                    onPress={() => {
                      setShowDetailModal(false);
                      orderPrescriptionDrugs(selectedPrescription);
                    }}
                  >
                    <Ionicons name="cart" size={20} color="#fff" />
                    <Text style={styles.orderAllButtonText}>Order All Medications</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  prescriptionsList: {
    padding: 20,
  },
  prescriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  prescriptionDoctor: {
    fontSize: 16,
    color: '#2196F3',
    marginBottom: 3,
  },
  prescriptionSpecialization: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  prescriptionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  prescriptionDate: {
    fontSize: 14,
    color: '#666',
  },
  expiryDate: {
    fontSize: 14,
    color: '#FF9800',
  },
  prescriptionDiagnosis: {
    fontSize: 14,
    color: '#333',
    marginBottom: 15,
    lineHeight: 20,
  },
  diagnosisLabel: {
    fontWeight: 'bold',
  },
  prescriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  drugCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drugCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 25,
  },
  prescriptionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailDoctor: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  detailStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginHorizontal: 5,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  drugCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  drugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  drugName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  drugDosage: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  drugDetails: {
    marginBottom: 10,
  },
  drugDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  drugDetailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  instructionsContainer: {
    marginBottom: 10,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  instructionsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  drugDescription: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  actionSection: {
    marginTop: 20,
  },
  orderAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
  },
  orderAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default PrescriptionsScreen;
