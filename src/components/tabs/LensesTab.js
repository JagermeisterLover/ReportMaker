// LensesTab.js - Lenses tab content

export const LensesTab = ({ activeLensTab, colorScheme }) => {
  const c = colorScheme;

  return React.createElement('div',
    { style: { padding: '20px' } },
    React.createElement('h2',
      { style: { color: c.text, marginBottom: '20px' } },
      activeLensTab || 'Lens 1'
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
      `Lens details for ${activeLensTab || 'Lens 1'} will be displayed here`
    )
  );
};
