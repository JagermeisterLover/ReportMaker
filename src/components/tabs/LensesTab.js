// LensesTab.js - Lenses tab content with LDE table for individual lenses

import { calculateFocalLengths, formatFocalLength } from '../../utils/focalLengthCalculator.js';
import { calculateAutocollimationPoints, formatAutocollimationDistance, formatAngularMagnification } from '../../utils/autocollimationCalculator.js';
import { OpticalSystemRenderer } from '../../utils/opticalSystemRenderer.js';

export const LensesTab = ({ selectedSystem, activeLensTab, colorScheme }) => {
  const c = colorScheme;

  // Get the active lens index (e.g., "Lens 1" -> 0)
  const lensIndex = activeLensTab ? parseInt(activeLensTab.replace('Lens ', '')) - 1 : 0;
  const lensData = selectedSystem?.lenses?.[lensIndex];

  if (!lensData || !lensData.ldeData) {
    return React.createElement('div',
      { style: { padding: '20px' } },
      React.createElement('div',
        {
          style: {
            padding: '40px',
            backgroundColor: c.panel,
            borderRadius: '8px',
            textAlign: 'center',
            color: c.textDim
          }
        },
        'No lens data available'
      )
    );
  }

  // Strip material from second surface for rendering (cemented doublet fix)
  const cleanedLdeData = React.useMemo(() => {
    return lensData.ldeData.map((surface, index) => {
      if (index === 1) {
        // Second surface - strip material properties
        return {
          ...surface,
          material: '',
          catalog: '',
          n: ''
        };
      }
      return surface;
    });
  }, [lensData.ldeData]);

  // Calculate focal lengths for this lens
  const focalLengths = React.useMemo(() => {
    return calculateFocalLengths(lensData.ldeData, lensData.wavelength || 550);
  }, [lensData.ldeData, lensData.wavelength]);

  // Calculate autocollimation points for this lens
  const autocollimationPoints = React.useMemo(() => {
    return calculateAutocollimationPoints(lensData.ldeData);
  }, [lensData.ldeData]);

  // Render LDE table header
  const renderTableHeader = () => {
    return React.createElement('thead', null,
      React.createElement('tr', null,
        ['Surface', 'Radius', 'Thickness', 'Material', 'Catalog', 'n', 'Semi-Diameter', 'Diameter'].map(header =>
          React.createElement('th',
            {
              key: header,
              style: {
                padding: '8px',
                backgroundColor: c.bg,
                color: c.text,
                borderBottom: `2px solid ${c.border}`,
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: '600'
              }
            },
            header
          )
        )
      )
    );
  };

  // Render LDE table rows
  const renderTableRows = () => {
    return React.createElement('tbody', null,
      cleanedLdeData.map((surface, index) =>
        React.createElement('tr',
          {
            key: index,
            style: {
              backgroundColor: index % 2 === 0 ? c.bg : c.panel
            }
          },
          React.createElement('td',
            { style: { padding: '8px', color: c.text, fontSize: '13px' } },
            surface.surface
          ),
          React.createElement('td',
            { style: { padding: '8px', color: c.text, fontSize: '13px' } },
            surface.radius === Infinity ? 'Infinity' : surface.radius
          ),
          React.createElement('td',
            { style: { padding: '8px', color: c.text, fontSize: '13px' } },
            surface.thickness === Infinity ? 'Infinity' : surface.thickness
          ),
          React.createElement('td',
            { style: { padding: '8px', color: c.text, fontSize: '13px' } },
            surface.material || ''
          ),
          React.createElement('td',
            { style: { padding: '8px', color: c.text, fontSize: '13px' } },
            surface.catalog || ''
          ),
          React.createElement('td',
            { style: { padding: '8px', color: c.text, fontSize: '13px' } },
            surface.n || ''
          ),
          React.createElement('td',
            { style: { padding: '8px', color: c.text, fontSize: '13px' } },
            surface.semiDiameter || ''
          ),
          React.createElement('td',
            { style: { padding: '8px', color: c.text, fontSize: '13px' } },
            surface.diameter || ''
          )
        )
      )
    );
  };

  return React.createElement('div',
    { style: { padding: '20px', height: '100%', overflow: 'auto' } },
    React.createElement('h2',
      { style: { color: c.text, marginBottom: '10px' } },
      activeLensTab || 'Lens 1'
    ),
    React.createElement('div',
      { style: { color: c.textDim, fontSize: '13px', marginBottom: '20px' } },
      `Lens Number: ${lensData.lensNumber}, Wavelength: ${lensData.wavelength || 550}nm`
    ),

    // LDE Table section
    React.createElement('div',
      { style: { marginBottom: '20px' } },
      React.createElement('h3',
        { style: { color: c.text, marginBottom: '12px', fontSize: '16px' } },
        'Lens Data'
      ),
      React.createElement('div',
        {
          style: {
            backgroundColor: c.panel,
            borderRadius: '8px',
            border: `1px solid ${c.border}`,
            maxHeight: '300px',
            overflow: 'auto'
          }
        },
        React.createElement('table',
          {
            style: {
              width: '100%',
              borderCollapse: 'collapse'
            }
          },
          renderTableHeader(),
          renderTableRows()
        )
      )
    ),

    // Lens Diagram section
    React.createElement('div',
      { style: { marginBottom: '20px' } },
      React.createElement('h3',
        { style: { color: c.text, marginBottom: '12px', fontSize: '16px' } },
        'Lens Diagram'
      ),
      React.createElement('div',
        {
          style: {
            backgroundColor: c.panel,
            borderRadius: '8px',
            padding: '20px',
            height: '400px'
          }
        },
        React.createElement(OpticalSystemRenderer, {
          surfaces: cleanedLdeData,
          options: {
            showAxis: true,
            showSurfaceNumbers: true,
            showDimensions: true,
            fillLenses: true,
            showTTL: false,
            showCT: true,
            showET: true,
            showOAL: true
          },
          width: 800,
          height: 400
        })
      )
    ),

    // Paraxial Properties section
    React.createElement('div',
      { style: { marginBottom: '20px' } },
      React.createElement('h3',
        { style: { color: c.text, marginBottom: '12px', fontSize: '16px' } },
        'Paraxial Properties'
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
      )
    ),

    // Autocollimation Points section
    autocollimationPoints.valid && React.createElement('div',
      { style: { marginBottom: '20px' } },
      React.createElement('h3',
        { style: { color: c.text, marginBottom: '12px', fontSize: '16px' } },
        'Autocollimation Points'
      ),
      React.createElement('div',
        {
          style: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }
        },
        // Normal orientation
        React.createElement('div', null,
          React.createElement('div',
            {
              style: {
                fontSize: '12px',
                fontWeight: '600',
                color: c.textDim,
                marginBottom: '8px'
              }
            },
            'Normal Orientation'
          ),
          React.createElement('div',
            {
              style: {
                padding: '12px',
                backgroundColor: c.panel,
                borderRadius: '8px',
                border: `1px solid ${c.border}`
              }
            },
            React.createElement('table',
              {
                style: {
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px'
                }
              },
              React.createElement('thead', null,
                React.createElement('tr', null,
                  React.createElement('th',
                    {
                      style: {
                        padding: '6px 8px',
                        color: c.textDim,
                        textAlign: 'center',
                        borderBottom: `1px solid ${c.border}`,
                        fontWeight: '600'
                      }
                    },
                    'Surface'
                  ),
                  React.createElement('th',
                    {
                      style: {
                        padding: '6px 8px',
                        color: c.textDim,
                        textAlign: 'center',
                        borderBottom: `1px solid ${c.border}`,
                        fontWeight: '600'
                      }
                    },
                    'L (mm)'
                  ),
                  React.createElement('th',
                    {
                      style: {
                        padding: '6px 8px',
                        color: c.textDim,
                        textAlign: 'center',
                        borderBottom: `1px solid ${c.border}`,
                        fontWeight: '600'
                      }
                    },
                    'γ'
                  )
                )
              ),
              React.createElement('tbody', null,
                ...autocollimationPoints.normal.map((point, idx) =>
                  React.createElement('tr',
                    { key: idx },
                    React.createElement('td',
                      {
                        style: {
                          padding: '6px 8px',
                          color: c.text,
                          textAlign: 'center'
                        }
                      },
                      point.surfaceNumber
                    ),
                    React.createElement('td',
                      {
                        style: {
                          padding: '6px 8px',
                          color: c.text,
                          textAlign: 'center',
                          fontFamily: 'monospace'
                        }
                      },
                      formatAutocollimationDistance(point.L, 3)
                    ),
                    React.createElement('td',
                      {
                        style: {
                          padding: '6px 8px',
                          color: c.text,
                          textAlign: 'center',
                          fontFamily: 'monospace'
                        }
                      },
                      formatAngularMagnification(point.gamma, 4)
                    )
                  )
                )
              )
            )
          )
        ),
        // Reversed orientation
        React.createElement('div', null,
          React.createElement('div',
            {
              style: {
                fontSize: '12px',
                fontWeight: '600',
                color: c.textDim,
                marginBottom: '8px'
              }
            },
            'Reversed Orientation'
          ),
          React.createElement('div',
            {
              style: {
                padding: '12px',
                backgroundColor: c.panel,
                borderRadius: '8px',
                border: `1px solid ${c.border}`
              }
            },
            React.createElement('table',
              {
                style: {
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px'
                }
              },
              React.createElement('thead', null,
                React.createElement('tr', null,
                  React.createElement('th',
                    {
                      style: {
                        padding: '6px 8px',
                        color: c.textDim,
                        textAlign: 'center',
                        borderBottom: `1px solid ${c.border}`,
                        fontWeight: '600'
                      }
                    },
                    'Surface'
                  ),
                  React.createElement('th',
                    {
                      style: {
                        padding: '6px 8px',
                        color: c.textDim,
                        textAlign: 'center',
                        borderBottom: `1px solid ${c.border}`,
                        fontWeight: '600'
                      }
                    },
                    'L (mm)'
                  ),
                  React.createElement('th',
                    {
                      style: {
                        padding: '6px 8px',
                        color: c.textDim,
                        textAlign: 'center',
                        borderBottom: `1px solid ${c.border}`,
                        fontWeight: '600'
                      }
                    },
                    'γ'
                  )
                )
              ),
              React.createElement('tbody', null,
                ...autocollimationPoints.reversed.map((point, idx) =>
                  React.createElement('tr',
                    { key: idx },
                    React.createElement('td',
                      {
                        style: {
                          padding: '6px 8px',
                          color: c.text,
                          textAlign: 'center'
                        }
                      },
                      point.surfaceNumber
                    ),
                    React.createElement('td',
                      {
                        style: {
                          padding: '6px 8px',
                          color: c.text,
                          textAlign: 'center',
                          fontFamily: 'monospace'
                        }
                      },
                      formatAutocollimationDistance(point.L, 3)
                    ),
                    React.createElement('td',
                      {
                        style: {
                          padding: '6px 8px',
                          color: c.text,
                          textAlign: 'center',
                          fontFamily: 'monospace'
                        }
                      },
                      formatAngularMagnification(point.gamma, 4)
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  );
};
