# Glass Catalog System

## Overview

The Glass Catalog System provides automatic refractive index calculation for optical glasses using industry-standard AGF (ZEMAX Glass Catalog) files. When you enter a glass name in the LDE (Lens Data Editor), the system automatically looks up the glass in the loaded catalogs and calculates its refractive index at the system's wavelength.

## How It Works

### 1. Catalog Loading

When the application starts, all AGF catalog files from `src/GlassCat/` are automatically loaded:
- **SCHOTT.AGF** - Schott glass catalog (728 glasses)
- **CDGM.AGF** - CDGM glass catalog
- **OPAL.AGF** - Opal glass catalog

### 2. Glass Name Entry

You can enter glass names in two ways:

#### Manual Entry in LDE
1. Open the LDE tab
2. Double-click the "Material" column for any surface
3. Enter the glass name (e.g., "N-BK7", "F2", "BK7G18")
4. The refractive index (n) is automatically calculated and displayed

#### Automatic Import from Zemax Files
When importing a .zmx file:
1. Glass names from the GLAS entries are automatically parsed
2. Refractive indices are calculated for all materials
3. Both material name and calculated n are populated in the LDE

### 3. Refractive Index Calculation

The system supports multiple dispersion formulas:

#### Formula 1: Schott
```
n² = a₀ + a₁λ² + a₂λ⁻² + a₃λ⁻⁴ + a₄λ⁻⁶ + a₅λ⁻⁸
```

#### Formula 2: Sellmeier 1 (Most Common)
```
n² - 1 = (K₁λ²)/(λ² - L₁) + (K₂λ²)/(λ² - L₂) + (K₃λ²)/(λ² - L₃)
```

#### Formula 3: Herzberger
```
n = A + BL + CL² + Dλ² + Eλ⁴ + Fλ⁶
where L = 1/(λ² - 0.028)
```

#### Formula 12: Extended 2
```
n² = a₀ + a₁λ² + a₂λ⁻² + a₃λ⁻⁴ + a₄λ⁻⁶ + a₅λ⁻⁸ + a₆λ⁴ + a₇λ⁶
```

## File Structure

### Core Modules

```
src/utils/
├── glassCalculator.js      - Core calculation engine
│   ├── parseAGFCatalog()   - Parses AGF files
│   ├── calculateRefractiveIndex() - Calculates n for glass at wavelength
│   ├── hasGlass()          - Check if glass exists
│   └── getGlassData()      - Get glass info
│
├── glassCatalogLoader.js   - Catalog loading utilities
│   ├── loadAllCatalogs()   - Load all AGF files
│   └── loadCatalog()       - Load specific catalog
│
└── zemaxParser.js          - Enhanced with automatic n calculation
```

### AGF Files

```
src/GlassCat/
├── SCHOTT.AGF   - Schott optical glasses
├── CDGM.AGF     - Chinese optical glasses
└── OPAL.AGF     - Opal optical glasses
```

## AGF File Format

Each glass entry in an AGF file contains:

```
NM <glass name> <formula#> <MIL#> <N(d)> <V(d)> <exclude> <status> <melt>
CD <coeff1> <coeff2> <coeff3> <coeff4> <coeff5> <coeff6> ...
```

Example:
```
NM N-BK7 2 517642.251 1.51680 64.17 0 1
CD 1.03961212E+00 2.31792344E-01 6.00069867E-03 2.00179144E-02 1.03560653E+02 0.00000000E+00
```

Where:
- **NM** = Name entry
- **Formula #2** = Sellmeier 1 formula
- **CD** = Coefficient data (K₁, L₁, K₂, L₂, K₃, L₃ for Sellmeier 1)

## Usage Examples

### Example 1: Manual Entry
```javascript
// User enters "N-BK7" in material column
// System calculates n = 1.516798 at 587.6nm
```

### Example 2: Programmatic Usage
```javascript
import { calculateRefractiveIndex } from './utils/glassCalculator.js';

const n = calculateRefractiveIndex('N-BK7', 550); // wavelength in nm
console.log(n); // Output: 1.519044
```

### Example 3: With Catalog Prefix
```javascript
// Both work identically:
const n1 = calculateRefractiveIndex('N-BK7', 550);
const n2 = calculateRefractiveIndex('SCHOTT:N-BK7', 550);
// n1 === n2
```

## System Wavelength

The refractive index calculation uses the system's wavelength setting:
- Default: 550 nm (green light)
- Can be changed in the Optical System tab
- Automatically used for all calculations in LDE

## Features

✓ **Automatic Calculation** - Enter glass name, get refractive index instantly
✓ **Multiple Catalogs** - SCHOTT, CDGM, OPAL supported
✓ **Multiple Formulas** - Schott, Sellmeier 1, Herzberger, Extended 2
✓ **Zemax Integration** - Import .zmx files with automatic n calculation
✓ **Case Insensitive** - Glass names are matched regardless of case
✓ **Catalog Prefix Support** - Use "SCHOTT:N-BK7" or just "N-BK7"

## Troubleshooting

### Glass Not Found
If you enter a glass name and the n column remains empty:
1. Check the spelling of the glass name
2. Verify the glass exists in the loaded catalogs
3. Check the console for warnings: `Glass "..." not found in catalogs`
4. Try with catalog prefix: "SCHOTT:N-BK7"

### Incorrect Refractive Index
If the calculated n seems wrong:
1. Verify the system wavelength is set correctly
2. Check the wavelength units (must be in nanometers)
3. Ensure the AGF file has the correct coefficients
4. Verify the dispersion formula number

### Catalogs Not Loading
If catalogs fail to load:
1. Check console for error messages
2. Verify AGF files exist in `src/GlassCat/`
3. Ensure files have .AGF extension (case-insensitive)
4. Check file encoding (should be UTF-8)

## Testing

Run the test script to verify the system:

```bash
node test/testGlassCalculator.js
```

Expected output:
```
=== Glass Catalog Test ===
Loaded 728 glasses from SCHOTT catalog

Testing refractive index calculations:

✓ BK7G18 at 550nm (visible)
  Result: n = 1.521497
  Formula: Sellmeier 1 (2)
...
```

## Technical Details

### Wavelength Units
- **Input**: Nanometers (nm)
- **Internal**: Micrometers (μm) for formula calculations
- **Automatic conversion** applied internally

### Precision
- Refractive index displayed to 6 decimal places
- Calculations performed in double precision
- Matches Zemax precision standards

### Performance
- Catalogs loaded once at startup
- Glass lookup: O(1) constant time (Map-based)
- Calculation: < 1ms per glass

## Adding New Catalogs

To add a new glass catalog:

1. Obtain an AGF file from the glass manufacturer
2. Place it in `src/GlassCat/`
3. Restart the application
4. The catalog will be automatically loaded

Supported manufacturers:
- Schott (included)
- CDGM (included)
- Opal (included)
- Ohara (add OHARA.AGF)
- Hoya (add HOYA.AGF)
- Any manufacturer using standard AGF format

## API Reference

### calculateRefractiveIndex(glassName, wavelengthNm)
Calculate refractive index for a glass at specific wavelength.

**Parameters:**
- `glassName` (string) - Name of the glass (e.g., "N-BK7")
- `wavelengthNm` (number) - Wavelength in nanometers

**Returns:**
- (number) - Refractive index, or null if glass not found

### hasGlass(glassName)
Check if a glass exists in the database.

**Parameters:**
- `glassName` (string) - Name of the glass

**Returns:**
- (boolean) - True if glass exists

### getGlassData(glassName)
Get complete glass data including formula and coefficients.

**Parameters:**
- `glassName` (string) - Name of the glass

**Returns:**
- (Object) - Glass data with name, catalog, formulaNumber, coefficients
- (null) - If glass not found

### loadAllCatalogs()
Load all AGF files from GlassCat directory.

**Returns:**
- (Promise<Object>) - Object with catalog names and load status

## References

- [Zemax AGF File Format](https://support.zemax.com/hc/en-us/articles/1500005576942)
- [Sellmeier Equation](https://en.wikipedia.org/wiki/Sellmeier_equation)
- [Schott Glass Catalog](https://www.schott.com/advanced_optics/english/download/index.html)
