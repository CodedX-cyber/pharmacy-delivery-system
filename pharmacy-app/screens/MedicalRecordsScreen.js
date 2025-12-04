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
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const { width } = Dimensions.get('window');

const MedicalRecordsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [medicalSummary, setMedicalSummary] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [activePrescriptions, setActivePrescriptions] = useState([]);

  useEffect(() => {
    loadMedicalData();
  }, []);

  const loadMedicalData = async () => {
    try {
      setLoading(true);
      
      // Load medical summary
      const summaryResponse = await api.get('/medical/summary');
      setMedicalSummary(summaryResponse.data.summary);
      
      // Load recent medical reports
      const reportsResponse = await api.get('/medical/reports?limit=3');
      setRecentReports(reportsResponse.data.reports);
      
      // Load upcoming appointments
      const appointmentsResponse = await api.get('/medical/appointments?status=scheduled&limit=3');
      setUpcomingAppointments(appointmentsResponse.data.appointments);
      
      // Load active prescriptions
      const prescriptionsResponse = await api.get('/medical/prescriptions?status=active&limit=3');
      setActivePrescriptions(prescriptionsResponse.data.prescriptions);
      
    } catch (error) {
      console.error('Error loading medical data:', error);
      Alert.alert('Error', 'Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedicalData();
    setRefreshing(false);
  };

  const renderMedicalSummary = () => {
    if (!medicalSummary) return null;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Medical Summary</Text>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Ionicons name="water" size={20} color="#2196F3" />
            <Text style={styles.summaryLabel}>Blood Type</Text>
            <Text style={styles.summaryValue}>{medicalSummary.blood_type || 'Not set'}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Ionicons name="person" size={20} color="#4CAF50" />
            <Text style={styles.summaryLabel}>Primary Doctor</Text>
            <Text style={styles.summaryValue}>{medicalSummary.primary_doctor_id ? 'Dr. Johnson' : 'Not set'}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Ionicons name="call" size={20} color="#FF9800" />
            <Text style={styles.summaryLabel}>Emergency Contact</Text>
            <Text style={styles.summaryValue}>{medicalSummary.emergency_contact_name || 'Not set'}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Ionicons name="card" size={20} color="#9C27B0" />
            <Text style={styles.summaryLabel}>Insurance</Text>
            <Text style={styles.summaryValue}>{medicalSummary.insurance_provider || 'Not set'}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('MedicalSummary')}
        >
          <Ionicons name="create" size={16} color="#fff" />
          <Text style={styles.editButtonText}>Edit Summary</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderQuickStats = () => {
    if (!medicalSummary?.statistics) return null;

    const stats = medicalSummary.statistics;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total_reports || 0}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.active_prescriptions || 0}</Text>
            <Text style={styles.statLabel}>Active Prescriptions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.upcoming_appointments || 0}</Text>
            <Text style={styles.statLabel}>Appointments</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.active_allergies || 0}</Text>
            <Text style={styles.statLabel}>Allergies</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecentReports = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MedicalReports')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      {recentReports.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text" size={40} color="#ccc" />
          <Text style={styles.emptyText}>No medical reports yet</Text>
        </View>
      ) : (
        recentReports.map((report) => (
          <TouchableOpacity 
            key={report.id} 
            style={styles.reportItem}
            onPress={() => navigation.navigate('MedicalReportDetail', { reportId: report.id })}
          >
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>{report.title}</Text>
              <Text style={styles.reportDate}>{new Date(report.report_date).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.reportDoctor}>Dr. {report.doctor_name}</Text>
            <Text style={styles.reportDiagnosis} numberOfLines={2}>{report.diagnosis}</Text>
            <View style={styles.reportFooter}>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(report.severity_level) }]}>
                <Text style={styles.severityText}>{report.severity_level}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderUpcomingAppointments = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      {upcomingAppointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar" size={40} color="#ccc" />
          <Text style={styles.emptyText}>No upcoming appointments</Text>
        </View>
      ) : (
        upcomingAppointments.map((appointment) => (
          <TouchableOpacity 
            key={appointment.id} 
            style={styles.appointmentItem}
            onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: appointment.id })}
          >
            <View style={styles.appointmentHeader}>
              <Text style={styles.appointmentTitle}>{appointment.purpose}</Text>
              <Text style={styles.appointmentDate}>{new Date(appointment.appointment_date).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.appointmentDoctor}>Dr. {appointment.doctor_name}</Text>
            <Text style={styles.appointmentTime}>{new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            <View style={styles.appointmentFooter}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                <Text style={styles.statusText}>{appointment.status}</Text>
              </View>
              <Text style={styles.appointmentFee}>${appointment.consultation_fee}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderActivePrescriptions = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Prescriptions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Prescriptions')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      {activePrescriptions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="medication" size={40} color="#ccc" />
          <Text style={styles.emptyText}>No active prescriptions</Text>
        </View>
      ) : (
        activePrescriptions.map((prescription) => (
          <TouchableOpacity 
            key={prescription.id} 
            style={styles.prescriptionItem}
            onPress={() => navigation.navigate('PrescriptionDetail', { prescriptionId: prescription.id })}
          >
            <View style={styles.prescriptionHeader}>
              <Text style={styles.prescriptionNumber}>{prescription.prescription_number}</Text>
              <Text style={styles.prescriptionDate}>{new Date(prescription.prescribed_date).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.prescriptionDiagnosis}>{prescription.diagnosis}</Text>
            <Text style={styles.prescriptionDoctor}>Dr. {prescription.doctor_name}</Text>
            <View style={styles.prescriptionFooter}>
              <Text style={styles.drugCount}>{prescription.drug_count} medications</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'mild': return '#4CAF50';
      case 'moderate': return '#FF9800';
      case 'severe': return '#F44336';
      case 'critical': return '#9C27B0';
      default: return '#ccc';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#2196F3';
      case 'confirmed': return '#4CAF50';
      case 'completed': return '#9E9E9E';
      case 'cancelled': return '#F44336';
      default: return '#ccc';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading medical records...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderMedicalSummary()}
      {renderQuickStats()}
      {renderRecentReports()}
      {renderUpcomingAppointments()}
      {renderActivePrescriptions()}
    </ScrollView>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  statsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    marginTop: 10,
  },
  reportItem: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  reportDate: {
    fontSize: 12,
    color: '#666',
  },
  reportDoctor: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 5,
  },
  reportDiagnosis: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  appointmentItem: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  appointmentDate: {
    fontSize: 12,
    color: '#666',
  },
  appointmentDoctor: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 5,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  appointmentFee: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  prescriptionItem: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  prescriptionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  prescriptionDate: {
    fontSize: 12,
    color: '#666',
  },
  prescriptionDiagnosis: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  prescriptionDoctor: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 10,
  },
  prescriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drugCount: {
    fontSize: 14,
    color: '#666',
  },
});

export default MedicalRecordsScreen;
