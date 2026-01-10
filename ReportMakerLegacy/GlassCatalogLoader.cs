using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReportMaker
{
    public static class GlassCatalogLoader
    {
        /// <summary> /// Loads all .agf glass catalog files from the specified directory. /// 
        /// </summary> /// <param name="directory">The directory to search for .agf files.</param> /// 
        /// <returns>A dictionary of glass catalog data, keyed by glass name.</returns> 
        public static Dictionary<string, GlassData> LoadAllGlassCatalogs(string directory)
        {
            var catalog = new Dictionary<string, GlassData>(StringComparer.OrdinalIgnoreCase);
            try
            {
                string[] files = Directory.GetFiles(directory, "*.agf");
                foreach (string file in files) { LoadGlassCatalog(file, catalog); }
            }
            catch (Exception ex)
            {
                // You can log the error or display a MessageBox if needed.
                MessageBox.Show("Error loading glass catalogs: " + ex.Message);
            }
            return catalog;
        }

        /// <summary>
        /// Loads a single glass catalog file and populates the provided dictionary.
        /// </summary>
        /// <param name="fileName">The .agf file to load.</param>
        /// <param name="catalog">The dictionary to populate with glass data.</param>
        private static void LoadGlassCatalog(string fileName, Dictionary<string, GlassData> catalog)
        {
            string[] lines = File.ReadAllLines(fileName);
            GlassData currentGlass = null;
            string currentGlassName = null;
            foreach (string line in lines)
            {
                string trimmed = line.Trim();
                if (trimmed.StartsWith("NM"))
                {
                    // Example: "NM BF1 12 0 1.524778 54.870980 0 0 -1"
                    string[] tokens = trimmed.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                    if (tokens.Length >= 3)
                    {
                        currentGlassName = tokens[1];
                        if (int.TryParse(tokens[2], out int formulaType))
                        {
                            // Support Sellmeier 1 (type 2) and Extended 2 (type 12)
                            if (formulaType == 2 || formulaType == 12)
                            {
                                currentGlass = new GlassData();
                                currentGlass.DispersionFormulaType = formulaType;
                            }
                            else
                            {
                                currentGlass = null;
                            }
                        }
                    }
                }
                else if (currentGlass != null && trimmed.StartsWith("CD"))
                {
                    string[] tokens = trimmed.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                    if (currentGlass.DispersionFormulaType == 2 && tokens.Length >= 7)
                    {
                        if (double.TryParse(tokens[1], NumberStyles.Float, CultureInfo.InvariantCulture, out double k1) &&
                            double.TryParse(tokens[2], NumberStyles.Float, CultureInfo.InvariantCulture, out double l1) &&
                            double.TryParse(tokens[3], NumberStyles.Float, CultureInfo.InvariantCulture, out double k2) &&
                            double.TryParse(tokens[4], NumberStyles.Float, CultureInfo.InvariantCulture, out double l2) &&
                            double.TryParse(tokens[5], NumberStyles.Float, CultureInfo.InvariantCulture, out double k3) &&
                            double.TryParse(tokens[6], NumberStyles.Float, CultureInfo.InvariantCulture, out double l3))
                        {
                            currentGlass.K1 = k1;
                            currentGlass.L1 = l1;
                            currentGlass.K2 = k2;
                            currentGlass.L2 = l2;
                            currentGlass.K3 = k3;
                            currentGlass.L3 = l3;
                            if (!string.IsNullOrEmpty(currentGlassName))
                            {
                                catalog[currentGlassName] = currentGlass;
                            }
                        }
                        currentGlass = null;
                        currentGlassName = null;
                    }
                    else if (currentGlass != null && currentGlass.DispersionFormulaType == 12 && tokens.Length >= 9)
                    {
                        if (double.TryParse(tokens[1], NumberStyles.Float, CultureInfo.InvariantCulture, out double a0) &&
                            double.TryParse(tokens[2], NumberStyles.Float, CultureInfo.InvariantCulture, out double a1) &&
                            double.TryParse(tokens[3], NumberStyles.Float, CultureInfo.InvariantCulture, out double a2) &&
                            double.TryParse(tokens[4], NumberStyles.Float, CultureInfo.InvariantCulture, out double a3) &&
                            double.TryParse(tokens[5], NumberStyles.Float, CultureInfo.InvariantCulture, out double a4) &&
                            double.TryParse(tokens[6], NumberStyles.Float, CultureInfo.InvariantCulture, out double a5) &&
                            double.TryParse(tokens[7], NumberStyles.Float, CultureInfo.InvariantCulture, out double a6) &&
                            double.TryParse(tokens[8], NumberStyles.Float, CultureInfo.InvariantCulture, out double a7))
                        {
                            currentGlass.A0 = a0;
                            currentGlass.A1 = a1;
                            currentGlass.A2 = a2;
                            currentGlass.A3 = a3;
                            currentGlass.A4 = a4;
                            currentGlass.A5 = a5;
                            currentGlass.A6 = a6;
                            currentGlass.A7 = a7;
                            if (!string.IsNullOrEmpty(currentGlassName))
                            {
                                catalog[currentGlassName] = currentGlass;
                            }
                        }
                        currentGlass = null;
                        currentGlassName = null;
                    }
                }
            }
        }
    }

}
