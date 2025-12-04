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
  Modal,
  TextInput,
  DatePickerAndroid,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const AppointmentsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    appointment_type: 'consultation',
    purpose: '',
    appointment_date: new Date(),
    duration_minutes: 30,
    symptoms: [],
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load appointments
      const appointmentsResponse = await api.get('/medical/appointments');
      setAppointments(appointmentsResponse.data.appointments);
      
      // Load doctors for booking
      const doctorsResponse = await api.get('/medical/doctors?available=true');
      setDoctors(doctorsResponse.data.doctors);
      
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const bookAppointment = async () => {
    if (!selectedDoctor) {
      Alert.alert('Error', 'Please select a doctor');
      return;
    }

    if (!bookingForm.purpose.trim()) {
      Alert.alert('Error', 'Please enter appointment purpose');
      return;
    }

    try {
      const appointmentData = {
        doctor_id: selectedDoctor.id,
        appointment_type: bookingForm.appointment_type,
        purpose: bookingForm.purpose,
        appointment_date: bookingForm.appointment_date.toISOString(),
        duration_minutes: bookingForm.duration_minutes,
        symptoms: bookingForm.symptoms,
        notes: bookingForm.notes
      };

      const response = await api.post('/medical/appointments', appointmentData);
      
      Alert.alert('Success', 'Appointment booked successfully!', [
        { text: 'OK', onPress: () => {
          setShowBookModal(false);
          onRefresh();
        }}
      ]);
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to book appointment');
    }
  };

  const cancelAppointment = async (appointmentId) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: async () => {
          try {
            await api.put(`/medical/appointments/${appointmentId}`, { status: 'cancelled' });
            Alert.alert('Success', 'Appointment cancelled');
            onRefresh();
          } catch (error) {
            Alert.alert('Error', 'Failed to cancel appointment');
          }
        }}
      ]
    );
  };

  const selectDate = async () => {
    if (Platform.OS === 'android') {
      try {
        const { action, year, month, day } = await DatePickerAndroid.open({
          date: bookingForm.appointment_date,
          minDate: new Date(),
          mode: 'default'
        });
        
        if (action === DatePickerAndroid.dateSetAction) {
          const selectedDate = new Date(year, month, day);
          setBookingForm(prev => ({ ...prev, appointment_date: selectedDate }));
        }
      } catch (error) {
        console.error('Error selecting date:', error);
      }
    } else {
      // For iOS, you might want to use a different date picker library
      Alert.alert('Info', 'Date selection feature coming soon for iOS');
    }
  };

  const renderAppointmentItem = ({ item }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentInfo}>
          <Text style={styles.appointmentPurpose}>{item.purpose}</Text>
          <Text style={styles.appointmentDoctor}>Dr. {item.doctor_name}</Text>
          <Text style={styles.appointmentSpecialization}>{item.specialization}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>
            {new Date(item.appointment_date).toLocaleDateString()} at {new Date(item.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.detailText}>{item.duration_minutes} minutes</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color="#666" />
          <Text style={styles.detailText}>${item.consultation_fee}</Text>
        </View>
      </View>
      
      {item.symptoms && item.symptoms.length > 0 && (
        <View style={styles.symptomsContainer}>
          <Text style={styles.symptomsTitle}>Symptoms:</Text>
          <View style={styles.symptomsList}>
            {item.symptoms.map((symptom, index) => (
              <Text key={index} style={styles.symptomItem}>• {symptom}</Text>
            ))}
          </View>
        </View>
      )}
      
      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>Notes:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}
      
      {(item.status === 'scheduled' || item.status === 'confirmed') && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => cancelAppointment(item.id)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderDoctorItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.doctorCard, selectedDoctor?.id === item.id && styles.selectedDoctorCard]}
      onPress={() => setSelectedDoctor(item)}
    >
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{item.name}</Text>
        <Text style={styles.doctorSpecialization}>{item.specialization}</Text>
        <Text style={styles.doctorClinic}>{item.hospital_clinic}</Text>
        <Text style={styles.doctorExperience}>{item.years_experience} years experience</Text>
      </View>
      <View style={styles.doctorPricing}>
        <Text style={styles.doctorFee}>${item.consultation_fee}</Text>
        <Text style={styles.feeLabel}>per visit</Text>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#2196F3';
      case 'confirmed': return '#4CAF50';
      case 'completed': return '#9E9E9E';
      case 'cancelled': return '#F44336';
      case 'no_show': return '#FF9800';
      default: return '#ccc';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading appointments...</Text>
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
          <Text style={styles.headerTitle}>My Appointments</Text>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => setShowBookModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.bookButtonText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>

        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>No appointments yet</Text>
            <Text style={styles.emptyText}>Book your first appointment with a doctor</Text>
          </View>
        ) : (
          <FlatList
            data={appointments}
            renderItem={renderAppointmentItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.appointmentsList}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Book Appointment Modal */}
      <Modal
        visible={showBookModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBookModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBookModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Book Appointment</Text>
            <TouchableOpacity onPress={bookAppointment}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Doctor Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Doctor</Text>
              <FlatList
                data={doctors}
                renderItem={renderDoctorItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.doctorsList}
                scrollEnabled={false}
              />
            </View>

            {selectedDoctor && (
              <>
                {/* Appointment Type */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Appointment Type</Text>
                  <View style={styles.typeButtons}>
                    {['consultation', 'follow_up', 'emergency'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeButton,
                          bookingForm.appointment_type === type && styles.selectedTypeButton
                        ]}
                        onPress={() => setBookingForm(prev => ({ ...prev, appointment_type: type }))}
                      >
                        <Text style={[
                          styles.typeButtonText,
                          bookingForm.appointment_type === type && styles.selectedTypeButtonText
                        ]}>
                          {type.replace('_', ' ').charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Purpose */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Purpose</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Describe the reason for your visit"
                    value={bookingForm.purpose}
                    onChangeText={(text) => setBookingForm(prev => ({ ...prev, purpose: text }))}
                    multiline
                  />
                </View>

                {/* Date Selection */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Date</Text>
                  <TouchableOpacity style={styles.dateButton} onPress={selectDate}>
                    <Ionicons name="calendar" size={20} color="#2196F3" />
                    <Text style={styles.dateButtonText}>
                      {bookingForm.appointment_date.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Duration */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Duration</Text>
                  <View style={styles.durationButtons}>
                    {[15, 30, 45, 60].map((duration) => (
                      <TouchableOpacity
                        key={duration}
                        style={[
                          styles.durationButton,
                          bookingForm.duration_minutes === duration && styles.selectedDurationButton
                        ]}
                        onPress={() => setBookingForm(prev => ({ ...prev, duration_minutes: duration }))}
                      >
                        <Text style={[
                          styles.durationButtonText,
                          bookingForm.duration_minutes === duration && styles.selectedDurationButtonText
                        ]}>
                          {duration} min
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Notes */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.notesInput]}
                    placeholder="Any additional information for the doctor"
                    value={bookingForm.notes}
                    onChangeText={(text) => setBookingForm(prev => ({ ...prev, notes: text }))}
                    multiline
                  />
                </View>

                {/* Fee Summary */}
                <View style={styles.feeSummary}>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Consultation Fee:</Text>
                    <Text style={styles.feeValue}>${selectedDoctor.consultation_fee}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.feeRow}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>${selectedDoctor.consultation_fee}</Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
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
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
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
  appointmentsList: {
    padding: 20,
  },
  appointmentCard: {
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
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentPurpose: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  appointmentDoctor: {
    fontSize: 16,
    color: '#2196F3',
    marginBottom: 3,
  },
  appointmentSpecialization: {
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
  appointmentDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  symptomsContainer: {
    marginBottom: 15,
  },
  symptomsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  symptomsList: {
    marginLeft: 10,
  },
  symptomItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  notesContainer: {
    marginBottom: 15,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
  doneButton: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  doctorsList: {
    maxHeight: 200,
  },
  doctorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDoctorCard: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  doctorSpecialization: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 2,
  },
  doctorClinic: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  doctorExperience: {
    fontSize: 12,
    color: '#999',
  },
  doctorPricing: {
    alignItems: 'flex-end',
  },
  doctorFee: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  feeLabel: {
    fontSize: 12,
    color: '#666',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedTypeButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedTypeButtonText: {
    color: '#fff',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  durationButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  selectedDurationButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  durationButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedDurationButtonText: {
    color: '#fff',
  },
  feeSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 16,
    color: '#666',
  },
  feeValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default AppointmentsScreen;
