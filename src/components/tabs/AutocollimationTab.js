// AutocollimationTab.js - Autocollimation Points tab content

export const AutocollimationTab = ({ colorScheme }) => {
  const c = colorScheme;

  return React.createElement('div',
    { style: { padding: '20px' } },
    React.createElement('h2',
      { style: { color: c.text, marginBottom: '20px' } },
      'Autocollimation Points'
    ),
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
      'Autocollimation points data will be displayed here'
    )
  );
};
