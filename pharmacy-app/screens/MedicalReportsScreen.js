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
  Image,
  Platform,
  ActionSheetIOS
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

const MedicalReportsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [addForm, setAddForm] = useState({
    doctor_id: '',
    report_type: 'consultation',
    title: '',
    description: '',
    diagnosis: '',
    symptoms: [],
    treatment_plan: '',
    notes: '',
    report_date: new Date().toISOString().split('T')[0],
    follow_up_date: '',
    severity_level: 'moderate',
    status: 'active'
  });
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load medical reports
      const reportsResponse = await api.get('/medical/reports');
      setReports(reportsResponse.data.reports);
      
      // Load doctors
      const doctorsResponse = await api.get('/medical/doctors');
      setDoctors(doctorsResponse.data.doctors);
      
    } catch (error) {
      console.error('Error loading medical reports:', error);
      Alert.alert('Error', 'Failed to load medical reports');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const pickImage = async () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await takePhoto();
          } else if (buttonIndex === 2) {
            await chooseFromLibrary();
          }
        }
      );
    } else {
      Alert.alert(
        'Add Attachment',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Library', onPress: chooseFromLibrary }
        ]
      );
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setAttachments(prev => [...prev, result.assets[0]]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const chooseFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setAttachments(prev => [...prev, result.assets[0]]);
      }
    } catch (error) {
      console.error('Error choosing image:', error);
      Alert.alert('Error', 'Failed to choose image');
    }
  };

  const addMedicalReport = async () => {
    if (!addForm.doctor_id) {
      Alert.alert('Error', 'Please select a doctor');
      return;
    }

    if (!addForm.title.trim()) {
      Alert.alert('Error', 'Please enter report title');
      return;
    }

    try {
      const formData = new FormData();
      
      // Add form fields
      Object.keys(addForm).forEach(key => {
        if (key !== 'symptoms' && addForm[key]) {
          formData.append(key, addForm[key]);
        }
      });

      // Add symptoms as JSON
      formData.append('symptoms', JSON.stringify(addForm.symptoms));

      // Add attachments
      attachments.forEach((asset, index) => {
        const localUri = asset.uri;
        const filename = localUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('attachments', {
          uri: localUri,
          name: filename,
          type,
        });
      });

      const response = await api.post('/medical/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Medical report added successfully!', [
        { text: 'OK', onPress: () => {
          setShowAddModal(false);
          resetAddForm();
          onRefresh();
        }}
      ]);
      
    } catch (error) {
      console.error('Error adding medical report:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to add medical report');
    }
  };

  const resetAddForm = () => {
    setAddForm({
      doctor_id: '',
      report_type: 'consultation',
      title: '',
      description: '',
      diagnosis: '',
      symptoms: [],
      treatment_plan: '',
      notes: '',
      report_date: new Date().toISOString().split('T')[0],
      follow_up_date: '',
      severity_level: 'moderate',
      status: 'active'
    });
    setAttachments([]);
  };

  const viewReportDetail = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const renderReportItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.reportCard}
      onPress={() => viewReportDetail(item)}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>{item.title}</Text>
          <Text style={styles.reportDoctor}>Dr. {item.doctor_name}</Text>
          <Text style={styles.reportSpecialization}>{item.specialization}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity_level) }]}>
          <Text style={styles.severityText}>{item.severity_level}</Text>
        </View>
      </View>

      <View style={styles.reportDetails}>
        <Text style={styles.reportDate}>{new Date(item.report_date).toLocaleDateString()}</Text>
        <Text style={styles.reportType}>{item.report_type.replace('_', ' ').toUpperCase()}</Text>
      </View>

      {item.diagnosis && (
        <Text style={styles.reportDiagnosis} numberOfLines={2}>
          <Text style={styles.diagnosisLabel}>Diagnosis: </Text>
          {item.diagnosis}
        </Text>
      )}

      {item.symptoms && item.symptoms.length > 0 && (
        <View style={styles.symptomsContainer}>
          <Text style={styles.symptomsTitle}>Symptoms:</Text>
          <View style={styles.symptomsList}>
            {item.symptoms.slice(0, 3).map((symptom, index) => (
              <Text key={index} style={styles.symptomItem}>• {symptom}</Text>
            ))}
            {item.symptoms.length > 3 && (
              <Text style={styles.moreSymptoms}>+{item.symptoms.length - 3} more</Text>
            )}
          </View>
        </View>
      )}

      {item.attachments && item.attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          <Ionicons name="attach" size={16} color="#666" />
          <Text style={styles.attachmentsText}>{item.attachments.length} attachment(s)</Text>
        </View>
      )}

      <View style={styles.reportFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  const renderAttachment = (attachment, index) => (
    <View key={index} style={styles.attachmentItem}>
      <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
      <TouchableOpacity 
        style={styles.removeAttachment}
        onPress={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
      >
        <Ionicons name="close-circle" size={24} color="#F44336" />
      </TouchableOpacity>
    </View>
  );

  const renderDoctorItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.doctorItem,
        addForm.doctor_id == item.id && styles.selectedDoctorItem
      ]}
      onPress={() => setAddForm(prev => ({ ...prev, doctor_id: item.id.toString() }))}
    >
      <Text style={styles.doctorName}>{item.name}</Text>
      <Text style={styles.doctorSpecialization}>{item.specialization}</Text>
    </TouchableOpacity>
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
      case 'active': return '#2196F3';
      case 'resolved': return '#4CAF50';
      case 'chronic': return '#FF9800';
      default: return '#ccc';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading medical reports...</Text>
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
          <Text style={styles.headerTitle}>Medical Reports</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Report</Text>
          </TouchableOpacity>
        </View>

        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>No medical reports yet</Text>
            <Text style={styles.emptyText}>Add your first medical report to get started</Text>
          </View>
        ) : (
          <FlatList
            data={reports}
            renderItem={renderReportItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.reportsList}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Add Report Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Medical Report</Text>
            <TouchableOpacity onPress={addMedicalReport}>
              <Text style={styles.doneButton}>Save</Text>
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

            {addForm.doctor_id && (
              <>
                {/* Report Type */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Report Type</Text>
                  <View style={styles.typeButtons}>
                    {['consultation', 'lab_result', 'imaging', 'discharge_summary'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeButton,
                          addForm.report_type === type && styles.selectedTypeButton
                        ]}
                        onPress={() => setAddForm(prev => ({ ...prev, report_type: type }))}
                      >
                        <Text style={[
                          styles.typeButtonText,
                          addForm.report_type === type && styles.selectedTypeButtonText
                        ]}>
                          {type.replace('_', ' ').charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Title */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Title *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter report title"
                    value={addForm.title}
                    onChangeText={(text) => setAddForm(prev => ({ ...prev, title: text }))}
                  />
                </View>

                {/* Description */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Enter detailed description"
                    value={addForm.description}
                    onChangeText={(text) => setAddForm(prev => ({ ...prev, description: text }))}
                    multiline
                  />
                </View>

                {/* Diagnosis */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Diagnosis</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Enter diagnosis"
                    value={addForm.diagnosis}
                    onChangeText={(text) => setAddForm(prev => ({ ...prev, diagnosis: text }))}
                    multiline
                  />
                </View>

                {/* Severity Level */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Severity Level</Text>
                  <View style={styles.severityButtons}>
                    {['mild', 'moderate', 'severe', 'critical'].map((severity) => (
                      <TouchableOpacity
                        key={severity}
                        style={[
                          styles.severityButton,
                          addForm.severity_level === severity && styles.selectedSeverityButton
                        ]}
                        onPress={() => setAddForm(prev => ({ ...prev, severity_level: severity }))}
                      >
                        <Text style={[
                          styles.severityButtonText,
                          addForm.severity_level === severity && styles.selectedSeverityButtonText
                        ]}>
                          {severity.charAt(0).toUpperCase() + severity.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Attachments */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Attachments</Text>
                    <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
                      <Ionicons name="camera" size={20} color="#2196F3" />
                    </TouchableOpacity>
                  </View>
                  
                  {attachments.length > 0 && (
                    <ScrollView horizontal style={styles.attachmentsList}>
                      {attachments.map((attachment, index) => renderAttachment(attachment, index))}
                    </ScrollView>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Report Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        {selectedReport && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Medical Report</Text>
              <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>{selectedReport.title}</Text>
                <View style={styles.detailMeta}>
                  <Text style={styles.detailDoctor}>Dr. {selectedReport.doctor_name}</Text>
                  <Text style={styles.detailDate}>{new Date(selectedReport.report_date).toLocaleDateString()}</Text>
                </View>
              </View>

              {selectedReport.description && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Description</Text>
                  <Text style={styles.detailText}>{selectedReport.description}</Text>
                </View>
              )}

              {selectedReport.diagnosis && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Diagnosis</Text>
                  <Text style={styles.detailText}>{selectedReport.diagnosis}</Text>
                </View>
              )}

              {selectedReport.symptoms && selectedReport.symptoms.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Symptoms</Text>
                  {selectedReport.symptoms.map((symptom, index) => (
                    <Text key={index} style={styles.symptomDetailItem}>• {symptom}</Text>
                  ))}
                </View>
              )}

              {selectedReport.treatment_plan && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Treatment Plan</Text>
                  <Text style={styles.detailText}>{selectedReport.treatment_plan}</Text>
                </View>
              )}

              {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Attachments</Text>
                  {selectedReport.attachments.map((attachment, index) => (
                    <View key={index} style={styles.attachmentDetailItem}>
                      <Ionicons name="attach" size={16} color="#2196F3" />
                      <Text style={styles.attachmentName}>Attachment {index + 1}</Text>
                    </View>
                  ))}
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
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
  reportsList: {
    padding: 20,
  },
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  reportDoctor: {
    fontSize: 16,
    color: '#2196F3',
    marginBottom: 3,
  },
  reportSpecialization: {
    fontSize: 14,
    color: '#666',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  severityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportDate: {
    fontSize: 14,
    color: '#666',
  },
  reportType: {
    fontSize: 12,
    color: '#999',
    fontWeight: 'bold',
  },
  reportDiagnosis: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  diagnosisLabel: {
    fontWeight: 'bold',
  },
  symptomsContainer: {
    marginBottom: 10,
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
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  moreSymptoms: {
    fontSize: 13,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  attachmentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  attachmentsText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 5,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  doctorsList: {
    maxHeight: 200,
  },
  doctorItem: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDoctorItem: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
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
  severityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  severityButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedSeverityButton: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  severityButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedSeverityButtonText: {
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  attachmentsList: {
    marginTop: 10,
  },
  attachmentItem: {
    marginRight: 10,
    position: 'relative',
  },
  attachmentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeAttachment: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  detailSection: {
    marginBottom: 25,
  },
  detailTitle: {
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
  detailDate: {
    fontSize: 14,
    color: '#666',
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
  symptomDetailItem: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  attachmentDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  attachmentName: {
    fontSize: 16,
    color: '#2196F3',
    marginLeft: 10,
  },
});

export default MedicalReportsScreen;
