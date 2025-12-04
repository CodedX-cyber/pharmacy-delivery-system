import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Chip,
  Avatar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Description as ReportIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const MedicalReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    user_id: '',
    doctor_id: '',
    report_type: 'consultation',
    title: '',
    description: '',
    diagnosis: '',
    symptoms: '',
    treatment_plan: '',
    notes: '',
    report_date: new Date().toISOString().split('T')[0],
    follow_up_date: '',
    severity_level: 'moderate',
    status: 'active'
  });

  const reportTypes = [
    'consultation',
    'lab_result',
    'imaging',
    'discharge_summary'
  ];

  const severityLevels = ['mild', 'moderate', 'severe', 'critical'];
  const statuses = ['active', 'resolved', 'chronic'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load reports
      const reportsResponse = await fetch('/api/admin/medical/reports', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData.reports || []);
      }

      // Load doctors
      const doctorsResponse = await fetch('/api/medical/doctors', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();
        setDoctors(doctorsData.doctors || []);
      }

      // Load users (simplified - you might need a separate endpoint)
      const usersResponse = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (report = null) => {
    if (report) {
      setEditingReport(report);
      setFormData({
        ...report,
        symptoms: report.symptoms ? report.symptoms.join(', ') : ''
      });
    } else {
      setEditingReport(null);
      setFormData({
        user_id: '',
        doctor_id: '',
        report_type: 'consultation',
        title: '',
        description: '',
        diagnosis: '',
        symptoms: '',
        treatment_plan: '',
        notes: '',
        report_date: new Date().toISOString().split('T')[0],
        follow_up_date: '',
        severity_level: 'moderate',
        status: 'active'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingReport(null);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setViewDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        symptoms: formData.symptoms ? formData.symptoms.split(',').map(s => s.trim()).filter(Boolean) : []
      };

      const url = editingReport 
        ? `/api/admin/medical/reports/${editingReport.id}`
        : '/api/admin/medical/reports';
      
      const method = editingReport ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) throw new Error('Failed to save report');

      toast.success(editingReport ? 'Report updated successfully' : 'Report added successfully');
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`/api/admin/medical/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete report');

      toast.success('Report deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      mild: '#4CAF50',
      moderate: '#FF9800',
      severe: '#F44336',
      critical: '#9C27B0'
    };
    return colors[severity] || '#666';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#2196F3',
      resolved: '#4CAF50',
      chronic: '#FF9800'
    };
    return colors[status] || '#666';
  };

  const getReportTypeColor = (type) => {
    const colors = {
      consultation: '#2196F3',
      lab_result: '#4CAF50',
      imaging: '#FF9800',
      discharge_summary: '#9C27B0'
    };
    return colors[type] || '#666';
  };

  const filteredReports = reports.filter(report => {
    if (tabValue === 0) return true; // All
    if (tabValue === 1) return report.status === 'active';
    if (tabValue === 2) return report.status === 'resolved';
    if (tabValue === 3) return report.status === 'chronic';
    return true;
  });

  const getStatistics = () => {
    const total = reports.length;
    const active = reports.filter(r => r.status === 'active').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const chronic = reports.filter(r => r.status === 'chronic').length;
    const severe = reports.filter(r => r.severity_level === 'severe' || r.severity_level === 'critical').length;

    return { total, active, resolved, chronic, severe };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <Typography>Loading medical reports...</Typography>
      </Box>
    );
  }

  const stats = getStatistics();

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Medical Reports Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Report
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#2196F3', mr: 2 }}>
                  <ReportIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{stats.total}</Typography>
                  <Typography color="textSecondary">Total Reports</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#4CAF50', mr: 2 }}>
                  <TrendingIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{stats.active}</Typography>
                  <Typography color="textSecondary">Active Cases</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#9C27B0', mr: 2 }}>
                  <HospitalIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{stats.resolved}</Typography>
                  <Typography color="textSecondary">Resolved</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#FF9800', mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{stats.chronic}</Typography>
                  <Typography color="textSecondary">Chronic</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#F44336', mr: 2 }}>
                  <ReportIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{stats.severe}</Typography>
                  <Typography color="textSecondary">Severe Cases</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box mb={2}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`All Reports (${stats.total})`} />
          <Tab label={`Active (${stats.active})`} />
          <Tab label={`Resolved (${stats.resolved})`} />
          <Tab label={`Chronic (${stats.chronic})`} />
        </Tabs>
      </Box>

      {/* Reports Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Report Details</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: '#2196F3' }}>
                          {report.user_name ? report.user_name.charAt(0) : 'P'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {report.user_name || `User ${report.user_id}`}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            ID: {report.user_id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{report.title}</Typography>
                        <Chip
                          label={report.report_type.replace('_', ' ')}
                          size="small"
                          sx={{
                            backgroundColor: getReportTypeColor(report.report_type),
                            color: 'white',
                            mt: 1
                          }}
                        />
                        {report.diagnosis && (
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            {report.diagnosis.substring(0, 50)}...
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          Dr. {report.doctor_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {report.specialization}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(report.report_date).toLocaleDateString()}
                      </Typography>
                      {report.follow_up_date && (
                        <Typography variant="caption" color="textSecondary">
                          Follow-up: {new Date(report.follow_up_date).toLocaleDateString()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.severity_level}
                        size="small"
                        sx={{
                          backgroundColor: getSeverityColor(report.severity_level),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(report.status),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          onClick={() => handleViewReport(report)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(report)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(report.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Report Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingReport ? 'Edit Medical Report' : 'Add New Medical Report'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Patient</InputLabel>
                  <Select
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  >
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Doctor</InputLabel>
                  <Select
                    value={formData.doctor_id}
                    onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                  >
                    {doctors.map((doctor) => (
                      <MenuItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name} ({doctor.specialization})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={formData.report_type}
                    onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                  >
                    {reportTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.replace('_', ' ').charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Diagnosis"
                  multiline
                  rows={2}
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Symptoms"
                  multiline
                  rows={2}
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  helperText="Comma-separated symptoms"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Treatment Plan"
                  multiline
                  rows={3}
                  value={formData.treatment_plan}
                  onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Report Date"
                  type="date"
                  value={formData.report_date}
                  onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Follow-up Date"
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel>Severity Level</InputLabel>
                  <Select
                    value={formData.severity_level}
                    onChange={(e) => setFormData({ ...formData, severity_level: e.target.value })}
                  >
                    {severityLevels.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {statuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingReport ? 'Update' : 'Add'} Report
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Medical Report Details</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6">{selectedReport.title}</Typography>
                <Box display="flex" gap={1} mt={1}>
                  <Chip
                    label={selectedReport.report_type.replace('_', ' ')}
                    size="small"
                    sx={{
                      backgroundColor: getReportTypeColor(selectedReport.report_type),
                      color: 'white'
                    }}
                  />
                  <Chip
                    label={selectedReport.severity_level}
                    size="small"
                    sx={{
                      backgroundColor: getSeverityColor(selectedReport.severity_level),
                      color: 'white'
                    }}
                  />
                  <Chip
                    label={selectedReport.status}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor(selectedReport.status),
                      color: 'white'
                    }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Patient</Typography>
                <Typography>{selectedReport.user_name || `User ${selectedReport.user_id}`}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Doctor</Typography>
                <Typography>Dr. {selectedReport.doctor_name} ({selectedReport.specialization})</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Report Date</Typography>
                <Typography>{new Date(selectedReport.report_date).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Follow-up Date</Typography>
                <Typography>
                  {selectedReport.follow_up_date 
                    ? new Date(selectedReport.follow_up_date).toLocaleDateString()
                    : 'Not set'
                  }
                </Typography>
              </Grid>
              
              {selectedReport.description && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Description</Typography>
                  <Typography>{selectedReport.description}</Typography>
                </Grid>
              )}
              
              {selectedReport.diagnosis && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Diagnosis</Typography>
                  <Typography>{selectedReport.diagnosis}</Typography>
                </Grid>
              )}
              
              {selectedReport.symptoms && selectedReport.symptoms.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Symptoms</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {selectedReport.symptoms.map((symptom, index) => (
                      <Chip key={index} label={symptom} size="small" />
                    ))}
                  </Box>
                </Grid>
              )}
              
              {selectedReport.treatment_plan && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Treatment Plan</Typography>
                  <Typography>{selectedReport.treatment_plan}</Typography>
                </Grid>
              )}
              
              {selectedReport.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Notes</Typography>
                  <Typography>{selectedReport.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicalReportsManagement;
