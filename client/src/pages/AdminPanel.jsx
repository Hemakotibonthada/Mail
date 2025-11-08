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
  InputLabel,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Block,
  CheckCircle,
  PersonAdd
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={2}
        pb={2}
        borderBottom="1px solid #edebe9"
      >
        <Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600,
              color: '#323130',
              mb: 0.5
            }}
          >
            Employee Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage user accounts and permissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={handleOpenDialog}
          sx={{
            bgcolor: '#0078d4',
            color: 'white',
            textTransform: 'none',
            fontWeight: 500,
            px: 2.5,
            py: 1,
            borderRadius: '2px',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#106ebe',
              boxShadow: 'none'
            }
          }}
        >
          Add Employee
        </Button>
      </Box>

      {/* Table */}
      <Paper 
        elevation={0} 
        sx={{ 
          border: '1px solid #edebe9',
          borderRadius: '2px',
          overflow: 'hidden'
        }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#faf9f8' }}>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: '#323130',
                  fontSize: '0.813rem',
                  py: 1.5,
                  borderBottom: '1px solid #edebe9'
                }}>
                  Email
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: '#323130',
                  fontSize: '0.813rem',
                  py: 1.5,
                  borderBottom: '1px solid #edebe9'
                }}>
                  Name
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: '#323130',
                  fontSize: '0.813rem',
                  py: 1.5,
                  borderBottom: '1px solid #edebe9'
                }}>
                  Domain
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: '#323130',
                  fontSize: '0.813rem',
                  py: 1.5,
                  borderBottom: '1px solid #edebe9'
                }}>
                  Role
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: '#323130',
                  fontSize: '0.813rem',
                  py: 1.5,
                  borderBottom: '1px solid #edebe9'
                }}>
                  Status
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: '#323130',
                  fontSize: '0.813rem',
                  py: 1.5,
                  borderBottom: '1px solid #edebe9'
                }}>
                  Quota
                </TableCell>
                <TableCell 
                  align="right"
                  sx={{ 
                    fontWeight: 600, 
                    color: '#323130',
                    fontSize: '0.813rem',
                    py: 1.5,
                    borderBottom: '1px solid #edebe9'
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={1}>
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          border: '3px solid #f3f2f1', 
                          borderTop: '3px solid #0078d4', 
                          borderRadius: '50%', 
                          animation: 'spin 1s linear infinite',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' }
                          }
                        }} 
                      />
                      <Typography variant="body2" color="text.secondary">Loading employees...</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No employees found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow 
                    key={employee.id}
                    sx={{
                      '&:hover': { bgcolor: '#f3f2f1' },
                      borderBottom: '1px solid #edebe9'
                    }}
                  >
                    <TableCell sx={{ 
                      fontSize: '0.875rem',
                      py: 1.5,
                      color: '#323130'
                    }}>
                      {employee.email}
                    </TableCell>
                    <TableCell sx={{ 
                      fontSize: '0.875rem',
                      py: 1.5,
                      color: '#323130'
                    }}>
                      {employee.displayName}
                    </TableCell>
                    <TableCell sx={{ 
                      fontSize: '0.875rem',
                      py: 1.5,
                      color: '#605e5c'
                    }}>
                      {employee.domain}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        label={employee.role}
                        size="small"
                        sx={{
                          bgcolor: employee.role === 'admin' ? '#0078d4' : '#f3f2f1',
                          color: employee.role === 'admin' ? 'white' : '#323130',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 22,
                          borderRadius: '2px',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        label={employee.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          bgcolor: employee.isActive ? '#dff6dd' : '#f3f2f1',
                          color: employee.isActive ? '#107c10' : '#605e5c',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 22,
                          borderRadius: '2px'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ 
                      fontSize: '0.875rem',
                      py: 1.5,
                      color: '#605e5c'
                    }}>
                      {((employee.quotaUsed || 0) / 1024 / 1024).toFixed(2)} MB / 
                      {(employee.quotaLimit / 1024 / 1024 / 1024).toFixed(1)} GB
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      {employee.isActive ? (
                        <IconButton
                          size="small"
                          onClick={() => handleDeactivate(employee.id)}
                          title="Deactivate"
                          sx={{
                            color: '#605e5c',
                            '&:hover': {
                              bgcolor: '#f3f2f1',
                              color: '#323130'
                            }
                          }}
                        >
                          <Block fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => handleReactivate(employee.id)}
                          title="Reactivate"
                          sx={{
                            color: '#107c10',
                            '&:hover': {
                              bgcolor: '#dff6dd'
                            }
                          }}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(employee.id)}
                        title="Delete"
                        sx={{
                          color: '#605e5c',
                          '&:hover': {
                            bgcolor: '#fde7e9',
                            color: '#d13438'
                          }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Employee Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '2px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#faf9f8', 
          borderBottom: '1px solid #edebe9',
          px: 3,
          py: 2
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonAdd sx={{ color: '#0078d4' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#323130' }}>
              Create New Employee
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <TextField
            fullWidth
            label="Username"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            margin="normal"
            placeholder="john.doe"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '2px',
                '&:hover fieldset': {
                  borderColor: '#0078d4'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0078d4',
                  borderWidth: '2px'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0078d4'
              }
            }}
          />

          <FormControl 
            fullWidth 
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '2px',
                '&:hover fieldset': {
                  borderColor: '#0078d4'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0078d4',
                  borderWidth: '2px'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0078d4'
              }
            }}
          >
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

          <Box 
            sx={{ 
              bgcolor: '#f3f2f1', 
              p: 1.5, 
              borderRadius: '2px',
              mt: 1,
              mb: 1
            }}
          >
            <Typography variant="body2" sx={{ color: '#605e5c', fontWeight: 500 }}>
              Email will be: <span style={{ color: '#0078d4', fontWeight: 600 }}>
                {formData.email || 'username'}@{formData.domain}
              </span>
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Display Name"
            value={formData.displayName}
            onChange={(e) => handleChange('displayName', e.target.value)}
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '2px',
                '&:hover fieldset': {
                  borderColor: '#0078d4'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0078d4',
                  borderWidth: '2px'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0078d4'
              }
            }}
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
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '2px',
                '&:hover fieldset': {
                  borderColor: '#0078d4'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0078d4',
                  borderWidth: '2px'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0078d4'
              }
            }}
          />

          <FormControl 
            fullWidth 
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '2px',
                '&:hover fieldset': {
                  borderColor: '#0078d4'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0078d4',
                  borderWidth: '2px'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0078d4'
              }
            }}
          >
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
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#faf9f8' }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              color: '#323130',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                bgcolor: '#f3f2f1'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateEmployee}
            variant="contained"
            disabled={!formData.email || !formData.displayName || !formData.password}
            sx={{
              bgcolor: '#0078d4',
              color: 'white',
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              borderRadius: '2px',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#106ebe',
                boxShadow: 'none'
              },
              '&:disabled': {
                bgcolor: '#f3f2f1',
                color: '#a19f9d'
              }
            }}
          >
            Create Employee
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
