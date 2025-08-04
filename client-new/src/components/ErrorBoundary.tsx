import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container, Alert } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h4" color="error" gutterBottom>
              Đã xảy ra lỗi
            </Typography>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body1">
                {this.state.error?.message || 'Đã xảy ra lỗi không mong muốn'}
              </Typography>
            </Alert>
            <Button 
              variant="contained" 
              onClick={this.handleReload}
              sx={{ mt: 2 }}
            >
              Tải lại trang
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 