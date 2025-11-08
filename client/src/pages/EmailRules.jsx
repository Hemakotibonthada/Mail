import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

const EmailRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form state
  const [ruleName, setRuleName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [conditionType, setConditionType] = useState('all');
  const [conditions, setConditions] = useState([{ field: 'from', operator: 'contains', value: '' }]);
  const [actions, setActions] = useState([{ type: 'moveToFolder', value: 'inbox' }]);

  const fieldOptions = [
    { value: 'from', label: 'From' },
    { value: 'to', label: 'To' },
    { value: 'subject', label: 'Subject' },
    { value: 'body', label: 'Body' },
    { value: 'hasAttachment', label: 'Has Attachment' }
  ];

  const operatorOptions = [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'notContains', label: 'Does not contain' },
    { value: 'exists', label: 'Exists' }
  ];

  const actionOptions = [
    { value: 'moveToFolder', label: 'Move to Folder' },
    { value: 'addLabel', label: 'Add Label' },
    { value: 'markAsRead', label: 'Mark as Read' },
    { value: 'markAsUnread', label: 'Mark as Unread' },
    { value: 'star', label: 'Star' },
    { value: 'delete', label: 'Delete' },
    { value: 'forward', label: 'Forward to' }
  ];

  const folderOptions = ['inbox', 'important', 'personal', 'work', 'archive', 'trash'];

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/email-rules', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      showSnackbar('Failed to load rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setRuleName(rule.name);
      setIsActive(rule.isActive);
      setConditionType(rule.conditions.type);
      setConditions(rule.conditions.rules);
      setActions(rule.actions);
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRule(null);
    resetForm();
  };

  const resetForm = () => {
    setRuleName('');
    setIsActive(true);
    setConditionType('all');
    setConditions([{ field: 'from', operator: 'contains', value: '' }]);
    setActions([{ type: 'moveToFolder', value: 'inbox' }]);
  };

  const handleSaveRule = async () => {
    try {
      const token = localStorage.getItem('token');
      const ruleData = {
        name: ruleName,
        isActive,
        conditions: {
          type: conditionType,
          rules: conditions
        },
        actions
      };

      const url = editingRule
        ? `http://localhost:3001/api/email-rules/${editingRule.id}`
        : 'http://localhost:3001/api/email-rules';

      const method = editingRule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ruleData)
      });

      if (response.ok) {
        showSnackbar(editingRule ? 'Rule updated successfully' : 'Rule created successfully', 'success');
        fetchRules();
        handleCloseDialog();
      } else {
        throw new Error('Failed to save rule');
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      showSnackbar('Failed to save rule', 'error');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/email-rules/${ruleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSnackbar('Rule deleted successfully', 'success');
        fetchRules();
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      showSnackbar('Failed to delete rule', 'error');
    }
  };

  const handleToggleRule = async (ruleId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/email-rules/${ruleId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSnackbar('Rule status updated', 'success');
        fetchRules();
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
      showSnackbar('Failed to update rule', 'error');
    }
  };

  const addCondition = () => {
    setConditions([...conditions, { field: 'from', operator: 'contains', value: '' }]);
  };

  const removeCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index, field, value) => {
    const updated = [...conditions];
    updated[index][field] = value;
    setConditions(updated);
  };

  const addAction = () => {
    setActions([...actions, { type: 'moveToFolder', value: 'inbox' }]);
  };

  const removeAction = (index) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index, field, value) => {
    const updated = [...actions];
    updated[index][field] = value;
    setActions(updated);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getActionLabel = (action) => {
    const option = actionOptions.find(opt => opt.value === action.type);
    return option ? `${option.label}: ${action.value}` : action.type;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Email Rules
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Automate your email workflow with custom rules
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Rule
        </Button>
      </Box>

      {/* Rules Table */}
      {loading ? (
        <Typography>Loading rules...</Typography>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <FilterIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No rules yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first rule to automate email management
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Create Your First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Conditions</TableCell>
                <TableCell>Actions</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {rule.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {rule.conditions.type === 'all' ? 'All' : 'Any'} of {rule.conditions.rules.length} condition(s)
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {rule.actions.slice(0, 2).map((action, idx) => (
                        <Chip
                          key={idx}
                          label={getActionLabel(action)}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      ))}
                      {rule.actions.length > 2 && (
                        <Chip label={`+${rule.actions.length - 2} more`} size="small" sx={{ mt: 0.5 }} />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.isActive ? 'Active' : 'Inactive'}
                      color={rule.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={rule.isActive ? 'Pause' : 'Activate'}>
                      <IconButton size="small" onClick={() => handleToggleRule(rule.id)}>
                        {rule.isActive ? <PauseIcon /> : <PlayIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenDialog(rule)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDeleteRule(rule.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingRule ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {/* Rule Name */}
            <TextField
              label="Rule Name"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              fullWidth
              required
            />

            {/* Active Status */}
            <FormControlLabel
              control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
              label="Active"
            />

            {/* Conditions */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Conditions
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <Select value={conditionType} onChange={(e) => setConditionType(e.target.value)}>
                  <MenuItem value="all">Match ALL of the following</MenuItem>
                  <MenuItem value="any">Match ANY of the following</MenuItem>
                </Select>
              </FormControl>

              {conditions.map((condition, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={condition.field}
                      onChange={(e) => updateCondition(index, 'field', e.target.value)}
                    >
                      {fieldOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    >
                      {operatorOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {condition.field !== 'hasAttachment' && (
                    <TextField
                      size="small"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      placeholder="Value"
                      fullWidth
                    />
                  )}

                  <IconButton
                    size="small"
                    onClick={() => removeCondition(index)}
                    disabled={conditions.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}

              <Button size="small" startIcon={<AddIcon />} onClick={addCondition}>
                Add Condition
              </Button>
            </Box>

            {/* Actions */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Actions
              </Typography>

              {actions.map((action, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select
                      value={action.type}
                      onChange={(e) => updateAction(index, 'type', e.target.value)}
                    >
                      {actionOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {['moveToFolder'].includes(action.type) && (
                    <FormControl size="small" fullWidth>
                      <Select
                        value={action.value}
                        onChange={(e) => updateAction(index, 'value', e.target.value)}
                      >
                        {folderOptions.map(folder => (
                          <MenuItem key={folder} value={folder}>{folder}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {['addLabel', 'forward'].includes(action.type) && (
                    <TextField
                      size="small"
                      value={action.value}
                      onChange={(e) => updateAction(index, 'value', e.target.value)}
                      placeholder={action.type === 'forward' ? 'Email address' : 'Label name'}
                      fullWidth
                    />
                  )}

                  <IconButton
                    size="small"
                    onClick={() => removeAction(index)}
                    disabled={actions.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}

              <Button size="small" startIcon={<AddIcon />} onClick={addAction}>
                Add Action
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveRule} variant="contained" disabled={!ruleName}>
            {editingRule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmailRules;
