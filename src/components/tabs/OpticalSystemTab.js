// OpticalSystemTab.js - Optical System tab content

import { calculateFocalLengths, formatFocalLength } from '../../utils/focalLengthCalculator.js';

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

  // Calculate focal lengths
  const ldeData = selectedSystem.ldeData || [];
  const focalLengths = React.useMemo(() => {
    return calculateFocalLengths(ldeData, selectedSystem.wavelength || 550);
  }, [selectedSystem]);

  const getCellValue = (row, field) => {
    const value = row[field];
    if (value === null || value === undefined) return '';
    if (value === Infinity) return 'Infinity';
    return value;
  };

  return React.createElement('div',
    { style: { padding: '20px', height: '100%', overflow: 'auto' } },
    React.createElement('h2',
      { style: { color: c.text, marginBottom: '16px' } },
      'Optical System'
    ),

    // Compact settings section
    React.createElement('div',
      {
        style: {
          padding: '16px',
          backgroundColor: c.panel,
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }
      },
      // Name input
      React.createElement('div', null,
        React.createElement('label',
          {
            style: {
              display: 'block',
              fontSize: '11px',
              fontWeight: '600',
              marginBottom: '6px',
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
              padding: '8px',
              backgroundColor: c.bg,
              color: c.text,
              border: `1px solid ${c.border}`,
              borderRadius: '4px',
              fontSize: '13px'
            }
          }
        )
      ),
      // Wavelength input
      React.createElement('div', null,
        React.createElement('label',
          {
            style: {
              display: 'block',
              fontSize: '11px',
              fontWeight: '600',
              marginBottom: '6px',
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
              width: '100%',
              padding: '8px',
              backgroundColor: c.bg,
              color: c.text,
              border: `1px solid ${c.border}`,
              borderRadius: '4px',
              fontSize: '13px'
            }
          }
        )
      ),
      // Description input (spans both columns)
      React.createElement('div',
        { style: { gridColumn: '1 / -1' } },
        React.createElement('label',
          {
            style: {
              display: 'block',
              fontSize: '11px',
              fontWeight: '600',
              marginBottom: '6px',
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
            rows: 2,
            style: {
              width: '100%',
              padding: '8px',
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
      )
    ),

    // LDE Table section
    React.createElement('div',
      {
        style: {
          marginBottom: '20px'
        }
      },
      React.createElement('h3',
        { style: { color: c.text, marginBottom: '12px', fontSize: '16px' } },
        'Lens Data Editor (LDE)'
      ),
      React.createElement('div',
        {
          style: {
            backgroundColor: c.panel,
            borderRadius: '8px',
            padding: '10px',
            maxHeight: '400px',
            overflow: 'auto'
          }
        },
        ldeData.length === 0
          ? React.createElement('div',
              { style: { padding: '20px', textAlign: 'center', color: c.textDim } },
              'No surface data available. Import a Zemax file or edit in the LDE tab.'
            )
          : React.createElement('table',
              {
                style: {
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                  border: `1px solid ${c.border}`
                }
              },
              React.createElement('thead', null,
                React.createElement('tr',
                  { style: { backgroundColor: c.bg } },
                  ['#', 'STOP', 'Radius', 'Thickness', 'Material', 'Catalog', 'n', 'Semi-Diameter', 'Diameter'].map(header =>
                    React.createElement('th',
                      {
                        key: header,
                        style: {
                          padding: '8px',
                          textAlign: header === 'STOP' ? 'center' : 'left',
                          color: c.textDim,
                          fontWeight: '600',
                          position: 'sticky',
                          top: 0,
                          backgroundColor: c.bg,
                          border: `1px solid ${c.border}`,
                          fontSize: '12px'
                        }
                      },
                      header
                    )
                  )
                )
              ),
              React.createElement('tbody', null,
                ldeData.map((row, index) =>
                  React.createElement('tr',
                    { key: index },
                    React.createElement('td',
                      {
                        style: {
                          padding: '6px 8px',
                          color: c.textDim,
                          backgroundColor: c.bg,
                          textAlign: 'center',
                          border: `1px solid ${c.border}`,
                          fontSize: '12px'
                        }
                      },
                      row.surface
                    ),
                    React.createElement('td',
                      {
                        style: {
                          padding: '6px 8px',
                          border: `1px solid ${c.border}`,
                          textAlign: 'center',
                          fontSize: '12px'
                        }
                      },
                      row.isStop ? '✓' : ''
                    ),
                    React.createElement('td',
                      {
                        style: {
                          padding: '6px 8px',
                          border: `1px solid ${c.border}`,
                          color: c.text,
                          fontFamily: 'monospace',
                          fontSize: '12px'
                        }
                      },
                      getCellValue(row, 'radius')
                    ),
                    React.createElement('td',
                      {
                        style: {
                          padding: '6px 8px',
                          border: `1px solid ${c.border}`,
                          color: c.text,
                          fontFamily: 'monospace',
                          fontSize: '12px'
                        }
                      },
                      getCellValue(row, 'thickness')
                    ),
                    React.createElement('td',
                      {
                        style: {
                          padding: '6px 8px',
                          border: `1px solid ${c.border}`,
                          color: c.text,
                          fontSize: '12px'
                        }
                      },
                      getCellValue(row, 'material')
                    ),
                    React.createElement('td',
                      {
                        style: {
                          padding: '6px 8px',
                          border: `1px solid ${c.border}`,
                          color: c.textDim,
                          fontSize: '12px'
                        }
                      },
                      getCellValue(row, 'catalog')
                    ),
                    React.createElement('td',
                      {
                        style: {
                          padding: '6px 8px',
                          border: `1px solid ${c.border}`,
                          color: c.text,
                          fontFamily: 'monospace',
                          fontSize: '12px'
                        }
                      },
                      getCellValue(row, 'n')
                    ),
                    React.createElement('td',
                      {
                        style: {
                          padding: '6px 8px',
                          border: `1px solid ${c.border}`,
                          color: c.text,
                          fontFamily: 'monospace',
                          fontSize: '12px'
                        }
                      },
                      getCellValue(row, 'semiDiameter')
                    ),
                    React.createElement('td',
                      {
                        style: {
                          padding: '6px 8px',
                          border: `1px solid ${c.border}`,
                          color: c.text,
                          fontFamily: 'monospace',
                          fontSize: '12px'
                        }
                      },
                      getCellValue(row, 'diameter')
                    )
                  )
                )
              )
            )
      )
    ),

    // Focal length calculations section
    React.createElement('div', null,
      React.createElement('h3',
        { style: { color: c.text, marginBottom: '12px', fontSize: '16px' } },
        'Optical Parameters'
      ),
      React.createElement('div',
        {
          style: {
            padding: '16px',
            backgroundColor: c.panel,
            borderRadius: '8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px'
          }
        },
        // EFFL
        React.createElement('div',
          {
            style: {
              padding: '12px',
              backgroundColor: c.bg,
              borderRadius: '6px',
              border: `1px solid ${c.border}`
            }
          },
          React.createElement('div',
            {
              style: {
                fontSize: '11px',
                fontWeight: '600',
                color: c.textDim,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }
            },
            'EFFL'
          ),
          React.createElement('div',
            {
              style: {
                fontSize: '20px',
                fontWeight: 'bold',
                color: focalLengths.valid ? c.accent : c.error,
                fontFamily: 'monospace'
              }
            },
            formatFocalLength(focalLengths.effl)
          ),
          React.createElement('div',
            {
              style: {
                fontSize: '11px',
                color: c.textDim,
                marginTop: '4px'
              }
            },
            'Effective Focal Length'
          )
        ),
        // FFL
        React.createElement('div',
          {
            style: {
              padding: '12px',
              backgroundColor: c.bg,
              borderRadius: '6px',
              border: `1px solid ${c.border}`
            }
          },
          React.createElement('div',
            {
              style: {
                fontSize: '11px',
                fontWeight: '600',
                color: c.textDim,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }
            },
            'FFL'
          ),
          React.createElement('div',
            {
              style: {
                fontSize: '20px',
                fontWeight: 'bold',
                color: focalLengths.valid ? c.accent : c.error,
                fontFamily: 'monospace'
              }
            },
            formatFocalLength(focalLengths.ffl)
          ),
          React.createElement('div',
            {
              style: {
                fontSize: '11px',
                color: c.textDim,
                marginTop: '4px'
              }
            },
            'Front Focal Length'
          )
        ),
        // BFL
        React.createElement('div',
          {
            style: {
              padding: '12px',
              backgroundColor: c.bg,
              borderRadius: '6px',
              border: `1px solid ${c.border}`
            }
          },
          React.createElement('div',
            {
              style: {
                fontSize: '11px',
                fontWeight: '600',
                color: c.textDim,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }
            },
            'BFL'
          ),
          React.createElement('div',
            {
              style: {
                fontSize: '20px',
                fontWeight: 'bold',
                color: focalLengths.valid ? c.accent : c.error,
                fontFamily: 'monospace'
              }
            },
            formatFocalLength(focalLengths.bfl)
          ),
          React.createElement('div',
            {
              style: {
                fontSize: '11px',
                color: c.textDim,
                marginTop: '4px'
              }
            },
            'Back Focal Length'
          )
        )
      ),
      // Error message if any
      !focalLengths.valid && focalLengths.error && React.createElement('div',
        {
          style: {
            marginTop: '12px',
            padding: '12px',
            backgroundColor: c.error + '20',
            border: `1px solid ${c.error}`,
            borderRadius: '6px',
            color: c.error,
            fontSize: '13px'
          }
        },
        '⚠ ' + focalLengths.error
      )
    )
  );
};
