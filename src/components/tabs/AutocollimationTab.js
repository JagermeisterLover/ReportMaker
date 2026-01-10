// AutocollimationTab.js - Autocollimation Points tab content

import { calculateAutocollimationPoints, formatAutocollimationDistance, formatAngularMagnification } from '../../utils/autocollimationCalculator.js';

export const AutocollimationTab = ({ system, colorScheme, locale }) => {
  const c = colorScheme;

  if (!system || !system.ldeData || system.ldeData.length === 0) {
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
        locale === 'ru' ? 'Нет данных оптической системы' : 'No optical system data available'
      )
    );
  }

  const results = calculateAutocollimationPoints(system.ldeData);

  if (!results.valid) {
    return React.createElement('div',
      { style: { padding: '20px' } },
      React.createElement('div',
        {
          style: {
            padding: '20px',
            backgroundColor: c.panel,
            borderRadius: '8px',
            color: c.error
          }
        },
        `Error: ${results.error || 'Failed to calculate autocollimation points'}`
      )
    );
  }

  const normalPoints = results.normal || [];
  const reversedPoints = results.reversed || [];

  // Helper function to render a table
  const renderTable = (points) => {
    return React.createElement('table',
      {
        style: {
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: c.panel,
          borderRadius: '4px',
          overflow: 'hidden'
        }
      },
      React.createElement('thead', null,
        React.createElement('tr', null,
          React.createElement('th',
            {
              style: {
                padding: '10px',
                backgroundColor: c.bg,
                color: c.text,
                border: `1px solid ${c.border}`,
                textAlign: 'center',
                fontWeight: 'bold'
              }
            },
            locale === 'ru' ? 'Поверхность' : 'Surface'
          ),
          React.createElement('th',
            {
              style: {
                padding: '10px',
                backgroundColor: c.bg,
                color: c.text,
                border: `1px solid ${c.border}`,
                textAlign: 'center',
                fontWeight: 'bold'
              }
            },
            'L (mm)'
          ),
          React.createElement('th',
            {
              style: {
                padding: '10px',
                backgroundColor: c.bg,
                color: c.text,
                border: `1px solid ${c.border}`,
                textAlign: 'center',
                fontWeight: 'bold'
              }
            },
            'γ'
          )
        )
      ),
      React.createElement('tbody', null,
        ...points.map((point, idx) =>
          React.createElement('tr',
            {
              key: idx,
              style: {
                backgroundColor: idx % 2 === 0 ? c.bg : c.panel
              }
            },
            React.createElement('td',
              {
                style: {
                  padding: '8px',
                  border: `1px solid ${c.border}`,
                  color: c.text,
                  textAlign: 'center'
                }
              },
              point.surfaceNumber
            ),
            React.createElement('td',
              {
                style: {
                  padding: '8px',
                  border: `1px solid ${c.border}`,
                  color: c.text,
                  textAlign: 'center'
                }
              },
              formatAutocollimationDistance(point.L, 3)
            ),
            React.createElement('td',
              {
                style: {
                  padding: '8px',
                  border: `1px solid ${c.border}`,
                  color: c.text,
                  textAlign: 'center'
                }
              },
              formatAngularMagnification(point.gamma, 4)
            )
          )
        )
      )
    );
  };

  return React.createElement('div',
    { style: { padding: '20px', height: '100%', overflow: 'auto' } },
    React.createElement('h2',
      { style: { color: c.text, marginBottom: '20px' } },
      locale === 'ru' ? 'Точки автоколлимации' : 'Autocollimation Points'
    ),

    // Normal orientation
    React.createElement('div',
      { style: { marginBottom: '40px' } },
      React.createElement('h3',
        { style: { color: c.text, marginBottom: '10px', fontSize: '16px' } },
        locale === 'ru' ? 'В нормальной ориентации' : 'Normal Orientation'
      ),
      normalPoints.length > 0
        ? renderTable(normalPoints)
        : React.createElement('div',
          {
            style: {
              padding: '20px',
              backgroundColor: c.panel,
              borderRadius: '8px',
              textAlign: 'center',
              color: c.textDim
            }
          },
          locale === 'ru' ? 'Нет данных' : 'No data'
        )
    ),

    // Reversed orientation
    React.createElement('div',
      null,
      React.createElement('h3',
        { style: { color: c.text, marginBottom: '10px', fontSize: '16px' } },
        locale === 'ru' ? 'В обратной ориентации' : 'Reversed Orientation'
      ),
      reversedPoints.length > 0
        ? renderTable(reversedPoints)
        : React.createElement('div',
          {
            style: {
              padding: '20px',
              backgroundColor: c.panel,
              borderRadius: '8px',
              textAlign: 'center',
              color: c.textDim
            }
          },
          locale === 'ru' ? 'Нет данных' : 'No data'
        )
    )
  );
};
