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
            padding: '12px',
            backgroundColor: c.error + '20',
            border: `1px solid ${c.error}`,
            borderRadius: '6px',
            color: c.error,
            fontSize: '13px'
          }
        },
        '⚠ ' + (results.error || 'Failed to calculate autocollimation points')
      )
    );
  }

  const normalPoints = results.normal || [];
  const reversedPoints = results.reversed || [];

  // Helper function to render a compact table
  const renderTable = (points) => {
    return React.createElement('div',
      {
        style: {
          backgroundColor: c.panel,
          borderRadius: '8px',
          border: `1px solid ${c.border}`,
          overflow: 'hidden'
        }
      },
      React.createElement('table',
        {
          style: {
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px'
          }
        },
        React.createElement('thead', null,
          React.createElement('tr',
            { style: { backgroundColor: c.bg } },
            React.createElement('th',
              {
                style: {
                  padding: '8px',
                  color: c.textDim,
                  border: `1px solid ${c.border}`,
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '12px'
                }
              },
              locale === 'ru' ? 'Поверхность' : 'Surface'
            ),
            React.createElement('th',
              {
                style: {
                  padding: '8px',
                  color: c.textDim,
                  border: `1px solid ${c.border}`,
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '12px'
                }
              },
              'L (mm)'
            ),
            React.createElement('th',
              {
                style: {
                  padding: '8px',
                  color: c.textDim,
                  border: `1px solid ${c.border}`,
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '12px'
                }
              },
              'γ'
            )
          )
        ),
        React.createElement('tbody', null,
          ...points.map((point, idx) =>
            React.createElement('tr',
              { key: idx },
              React.createElement('td',
                {
                  style: {
                    padding: '6px 8px',
                    border: `1px solid ${c.border}`,
                    color: c.text,
                    textAlign: 'center',
                    backgroundColor: c.bg,
                    fontSize: '12px'
                  }
                },
                point.surfaceNumber
              ),
              React.createElement('td',
                {
                  style: {
                    padding: '6px 8px',
                    border: `1px solid ${c.border}`,
                    color: c.text,
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }
                },
                formatAutocollimationDistance(point.L, 3)
              ),
              React.createElement('td',
                {
                  style: {
                    padding: '6px 8px',
                    border: `1px solid ${c.border}`,
                    color: c.text,
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }
                },
                formatAngularMagnification(point.gamma, 4)
              )
            )
          )
        )
      )
    );
  };

  return React.createElement('div',
    { style: { padding: '20px', height: '100%', overflow: 'auto' } },
    React.createElement('h2',
      { style: { color: c.text, marginBottom: '16px' } },
      locale === 'ru' ? 'Точки автоколлимации' : 'Autocollimation Points'
    ),

    // Two-column layout for compact view
    React.createElement('div',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px'
        }
      },
      // Normal orientation
      React.createElement('div', null,
        React.createElement('h3',
          { style: { color: c.text, marginBottom: '12px', fontSize: '16px' } },
          locale === 'ru' ? 'Нормальная ориентация' : 'Normal Orientation'
        ),
        normalPoints.length > 0
          ? renderTable(normalPoints)
          : React.createElement('div',
            {
              style: {
                padding: '20px',
                backgroundColor: c.panel,
                borderRadius: '8px',
                border: `1px solid ${c.border}`,
                textAlign: 'center',
                color: c.textDim,
                fontSize: '13px'
              }
            },
            locale === 'ru' ? 'Нет данных' : 'No data'
          )
      ),

      // Reversed orientation
      React.createElement('div', null,
        React.createElement('h3',
          { style: { color: c.text, marginBottom: '12px', fontSize: '16px' } },
          locale === 'ru' ? 'Обратная ориентация' : 'Reversed Orientation'
        ),
        reversedPoints.length > 0
          ? renderTable(reversedPoints)
          : React.createElement('div',
            {
              style: {
                padding: '20px',
                backgroundColor: c.panel,
                borderRadius: '8px',
                border: `1px solid ${c.border}`,
                textAlign: 'center',
                color: c.textDim,
                fontSize: '13px'
              }
            },
            locale === 'ru' ? 'Нет данных' : 'No data'
          )
      )
    )
  );
};
