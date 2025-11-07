import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Block,
  CheckCircle
} from '@mui/icons-material';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    role: 'employee',
    domain: 'circuvent.com'
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllEmployees();
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      email: '',
      displayName: '',
      password: '',
      role: 'employee',
      domain: 'circuvent.com'
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateEmployee = async () => {
    try {
      const username = formData.email.split('@')[0];
      const email = `${username}@${formData.domain}`;

      await userAPI.createEmployee({
        ...formData,
        email: email
      });

      toast.success(`Employee ${email} created successfully!`);
      handleCloseDialog();
      loadEmployees();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create employee');
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      await userAPI.deactivate(userId);
      toast.success('Employee deactivated');
      loadEmployees();
    } catch (error) {
      toast.error('Failed to deactivate employee');
    }
  };

  const handleReactivate = async (userId) => {
    try {
      await userAPI.reactivate(userId);
      toast.success('Employee reactivated');
      loadEmployees();
    } catch (error) {
      toast.error('Failed to reactivate employee');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this employee? This action cannot be undone.')) {
      return;
    }

    try {
      await userAPI.deleteEmployee(userId);
      toast.success('Employee deleted');
      loadEmployees();
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Employee Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          Add Employee
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Quota</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.displayName}</TableCell>
                  <TableCell>{employee.domain}</TableCell>
                  <TableCell>
                    <Chip
                      label={employee.role}
                      color={employee.role === 'admin' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={employee.isActive ? 'Active' : 'Inactive'}
                      color={employee.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {((employee.quotaUsed || 0) / 1024 / 1024).toFixed(2)} MB / 
                    {(employee.quotaLimit / 1024 / 1024 / 1024).toFixed(1)} GB
                  </TableCell>
                  <TableCell align="right">
                    {employee.isActive ? (
                      <IconButton
                        size="small"
                        onClick={() => handleDeactivate(employee.id)}
                        title="Deactivate"
                      >
                        <Block />
                      </IconButton>
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => handleReactivate(employee.id)}
                        title="Reactivate"
                      >
                        <CheckCircle />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(employee.id)}
                      title="Delete"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Employee</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Username (before @)"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            margin="normal"
            placeholder="john.doe"
            required
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Domain</InputLabel>
            <Select
              value={formData.domain}
              onChange={(e) => handleChange('domain', e.target.value)}
              label="Domain"
            >
              <MenuItem value="circuvent.com">@circuvent.com</MenuItem>
              <MenuItem value="htresearchlab.com">@htresearchlab.com</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="caption" color="text.secondary">
            Email will be: {formData.email}@{formData.domain}
          </Typography>

          <TextField
            fullWidth
            label="Display Name"
            value={formData.displayName}
            onChange={(e) => handleChange('displayName', e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            margin="normal"
            required
            helperText="Minimum 6 characters"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              label="Role"
            >
              <MenuItem value="employee">Employee</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleCreateEmployee}
            variant="contained"
            disabled={!formData.email || !formData.displayName || !formData.password}
          >
            Create Employee
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
