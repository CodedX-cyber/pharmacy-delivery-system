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
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  MedicalServices as MedicalIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const DoctorsManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    license_number: '',
    hospital_clinic: '',
    years_experience: '',
    consultation_fee: '',
    available_days: [],
    available_time_start: '',
    available_time_end: '',
    bio: '',
    is_active: true
  });

  const specializations = [
    'General Practitioner',
    'Cardiologist',
    'Pediatrician',
    'Orthopedic Surgeon',
    'Dermatologist',
    'Neurologist',
    'Psychiatrist',
    'Gynecologist',
    'Ophthalmologist',
    'ENT Specialist'
  ];

  const weekDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/medical/doctors', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load doctors');
      
      const data = await response.json();
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (doctor = null) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        ...doctor,
        available_days: doctor.available_days ? JSON.parse(doctor.available_days) : []
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        license_number: '',
        hospital_clinic: '',
        years_experience: '',
        consultation_fee: '',
        available_days: [],
        available_time_start: '',
        available_time_end: '',
        bio: '',
        is_active: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDoctor(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        available_days: JSON.stringify(formData.available_days)
      };

      const url = editingDoctor 
        ? `/api/admin/medical/doctors/${editingDoctor.id}`
        : '/api/admin/medical/doctors';
      
      const method = editingDoctor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) throw new Error('Failed to save doctor');

      toast.success(editingDoctor ? 'Doctor updated successfully' : 'Doctor added successfully');
      handleCloseDialog();
      loadDoctors();
    } catch (error) {
      console.error('Error saving doctor:', error);
      toast.error('Failed to save doctor');
    }
  };

  const handleDelete = async (doctorId) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) return;

    try {
      const response = await fetch(`/api/admin/medical/doctors/${doctorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete doctor');

      toast.success('Doctor deleted successfully');
      loadDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast.error('Failed to delete doctor');
    }
  };

  const getSpecializationColor = (specialization) => {
    const colors = {
      'General Practitioner': '#2196F3',
      'Cardiologist': '#F44336',
      'Pediatrician': '#4CAF50',
      'Orthopedic Surgeon': '#FF9800',
      'Dermatologist': '#9C27B0',
      'Neurologist': '#00BCD4',
      'Psychiatrist': '#795548',
      'Gynecologist': '#E91E63',
      'Ophthalmologist': '#607D8B',
      'ENT Specialist': '#3F51B5'
    };
    return colors[specialization] || '#666';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <Typography>Loading doctors...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Doctors Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Doctor
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#2196F3', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{doctors.length}</Typography>
                  <Typography color="textSecondary">Total Doctors</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#4CAF50', mr: 2 }}>
                  <MedicalIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {doctors.filter(d => d.is_active).length}
                  </Typography>
                  <Typography color="textSecondary">Active Doctors</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#FF9800', mr: 2 }}>
                  <MedicalIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {new Set(doctors.map(d => d.specialization)).size}
                  </Typography>
                  <Typography color="textSecondary">Specializations</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#9C27B0', mr: 2 }}>
                  <MedicalIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    ${doctors.reduce((sum, d) => sum + parseFloat(d.consultation_fee || 0), 0).toFixed(0)}
                  </Typography>
                  <Typography color="textSecondary">Avg Consultation Fee</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Doctors Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Specialization</TableCell>
                  <TableCell>Hospital/Clinic</TableCell>
                  <TableCell>Experience</TableCell>
                  <TableCell>Consultation Fee</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: getSpecializationColor(doctor.specialization) }}>
                          {doctor.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{doctor.name}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {doctor.email}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {doctor.phone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doctor.specialization}
                        size="small"
                        sx={{
                          backgroundColor: getSpecializationColor(doctor.specialization),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>{doctor.hospital_clinic}</TableCell>
                    <TableCell>{doctor.years_experience} years</TableCell>
                    <TableCell>${doctor.consultation_fee}</TableCell>
                    <TableCell>
                      <Chip
                        label={doctor.is_active ? 'Active' : 'Inactive'}
                        color={doctor.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(doctor)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(doctor.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Doctor Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Specialization</InputLabel>
                  <Select
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  >
                    {specializations.map((spec) => (
                      <MenuItem key={spec} value={spec}>
                        {spec}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="License Number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hospital/Clinic"
                  value={formData.hospital_clinic}
                  onChange={(e) => setFormData({ ...formData, hospital_clinic: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Years of Experience"
                  type="number"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Consultation Fee"
                  type="number"
                  value={formData.consultation_fee}
                  onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Available Days"
                  value={formData.available_days.join(', ')}
                  onChange={(e) => setFormData({ ...formData, available_days: e.target.value.split(', ').filter(Boolean) })}
                  helperText="Comma-separated days"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Available Time Start"
                  type="time"
                  value={formData.available_time_start}
                  onChange={(e) => setFormData({ ...formData, available_time_start: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Available Time End"
                  type="time"
                  value={formData.available_time_end}
                  onChange={(e) => setFormData({ ...formData, available_time_end: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingDoctor ? 'Update' : 'Add'} Doctor
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DoctorsManagement;
