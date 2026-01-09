// OpticalSystemTab.js - Optical System tab content

export const OpticalSystemTab = ({ selectedSystem, setSelectedSystem, saveCurrentSystem, colorScheme }) => {
  const c = colorScheme;
  const [localName, setLocalName] = React.useState(selectedSystem.name);
  const [localDescription, setLocalDescription] = React.useState(selectedSystem.description || '');

  // Update local state when selectedSystem changes
  React.useEffect(() => {
    setLocalName(selectedSystem.name);
    setLocalDescription(selectedSystem.description || '');
  }, [selectedSystem]);

  const handleNameBlur = async () => {
    if (localName && localName !== selectedSystem.name) {
      // Rename system
      if (window.electronAPI && window.electronAPI.deleteSystem && window.electronAPI.saveSystem) {
        // Delete old file
        await window.electronAPI.deleteSystem(selectedSystem.folderPath || '', selectedSystem.name);
        // Save with new name
        const updatedSystem = { ...selectedSystem, name: localName };
        await window.electronAPI.saveSystem(selectedSystem.folderPath || '', localName, updatedSystem);
        setSelectedSystem(updatedSystem);
      }
    }
  };

  const handleDescriptionChange = (newDescription) => {
    setLocalDescription(newDescription);
    setSelectedSystem({ ...selectedSystem, description: newDescription });
    saveCurrentSystem();
  };

  return React.createElement('div',
    { style: { padding: '20px' } },
    React.createElement('h2',
      { style: { color: c.text, marginBottom: '20px' } },
      'Optical System'
    ),
    React.createElement('div',
      {
        style: {
          padding: '20px',
          backgroundColor: c.panel,
          borderRadius: '8px'
        }
      },
      // Name input
      React.createElement('div',
        { style: { marginBottom: '20px' } },
        React.createElement('label',
          {
            style: {
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '8px',
              color: c.textDim,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }
          },
          'Name'
        ),
        React.createElement('input',
          {
            type: 'text',
            value: localName,
            onChange: (e) => setLocalName(e.target.value),
            onBlur: handleNameBlur,
            style: {
              width: '100%',
              padding: '10px',
              backgroundColor: c.bg,
              color: c.text,
              border: `1px solid ${c.border}`,
              borderRadius: '4px',
              fontSize: '13px'
            }
          }
        )
      ),
      // Description input
      React.createElement('div',
        { style: { marginBottom: '20px' } },
        React.createElement('label',
          {
            style: {
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '8px',
              color: c.textDim,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }
          },
          'Description'
        ),
        React.createElement('textarea',
          {
            value: localDescription,
            onChange: (e) => handleDescriptionChange(e.target.value),
            rows: 4,
            style: {
              width: '100%',
              padding: '10px',
              backgroundColor: c.bg,
              color: c.text,
              border: `1px solid ${c.border}`,
              borderRadius: '4px',
              fontSize: '13px',
              resize: 'vertical',
              fontFamily: 'Arial, sans-serif'
            }
          }
        )
      ),
      // Wavelength input
      React.createElement('div',
        { style: { marginBottom: '20px' } },
        React.createElement('label',
          {
            style: {
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '8px',
              color: c.textDim,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }
          },
          'Wavelength (nm)'
        ),
        React.createElement('input',
          {
            type: 'number',
            value: selectedSystem.wavelength || 550,
            onChange: (e) => {
              const newWavelength = parseFloat(e.target.value) || 550;
              setSelectedSystem({ ...selectedSystem, wavelength: newWavelength });
              saveCurrentSystem();
            },
            step: '0.1',
            min: '100',
            max: '10000',
            style: {
              width: '200px',
              padding: '10px',
              backgroundColor: c.bg,
              color: c.text,
              border: `1px solid ${c.border}`,
              borderRadius: '4px',
              fontSize: '13px'
            }
          }
        )
      )
    )
  );
};
