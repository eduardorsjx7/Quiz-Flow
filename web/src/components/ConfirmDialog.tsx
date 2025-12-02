import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'delete' | 'warning' | 'info';
  loading?: boolean;
  hideButtons?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmText = 'Sim',
  cancelText = 'Não',
  onConfirm,
  onCancel,
  type = 'warning',
  loading = false,
  hideButtons = false,
}) => {
  const getColor = () => {
    switch (type) {
      case 'delete':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
        return '#2196F3';
      default:
        return '#ff9800';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        },
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: `${getColor()}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WarningIcon sx={{ fontSize: 28, color: getColor() }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#011b49' }}>
            {title}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onCancel}
          disabled={loading}
          sx={{
            color: '#6b7280',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: hideButtons ? 3 : 2 }}>
        <Typography variant="body1" sx={{ color: '#6b7280', lineHeight: 1.6 }}>
          {message}
        </Typography>
      </DialogContent>

      {!hideButtons && (
        <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
            sx={{
              minWidth: 120,
              py: 1,
              borderColor: 'grey.300',
              color: '#011b49',
              fontWeight: 500,
              '&:hover': {
                borderColor: 'grey.400',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            {cancelText}
          </Button>
          <Button
            variant="contained"
            onClick={onConfirm}
            disabled={loading}
            sx={{
              minWidth: 120,
              py: 1,
              bgcolor: getColor(),
              color: '#ffffff',
              fontWeight: 600,
              '&:hover': {
                bgcolor: type === 'delete' ? '#d32f2f' : type === 'warning' ? '#f57c00' : '#1976d2',
              },
              '&:disabled': {
                bgcolor: '#bdbdbd',
              },
            }}
          >
            {loading ? 'Processando...' : confirmText}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

