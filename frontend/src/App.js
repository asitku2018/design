import React from 'react';
import CanvasEditor from './components/CanvasEditor';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Pro T-Shirt Designer</h1>
      {/* We pass a dummy designId for testing */}
      <CanvasEditor designId="design_12345" />
    </div>
  );
}

export default App;
