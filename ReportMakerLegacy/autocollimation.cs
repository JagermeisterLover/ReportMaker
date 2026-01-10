using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace ReportMaker
{
    // Represents a single optical surface used for autocollimation calculations.
    public class OpticalSurface
    {
        public double R { get; set; }         // Radius of curvature
        public double t { get; set; }         // Thickness
        public double n_after { get; set; }   // Refractive index after the surface
        public double n_before { get; set; }  // Refractive index before the surface
        public double Diameter { get; set; }  // Add Diameter property

        public static OpticalSurface Parse(string line)
        {
            var tokens = line.Split(new char[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
            int tokenIndex = 0;

            if (int.TryParse(tokens[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out int dummy))
            {
                tokenIndex = 1; // Skip surface number
            }

            double R = double.Parse(tokens[tokenIndex], CultureInfo.InvariantCulture);
            double t = double.Parse(tokens[tokenIndex + 1], CultureInfo.InvariantCulture);
            double n_after = double.Parse(tokens[tokenIndex + 2], CultureInfo.InvariantCulture);
            double diameter = tokens.Length > tokenIndex + 3
                ? double.Parse(tokens[tokenIndex + 3], CultureInfo.InvariantCulture)
                : 0.0; // Parse diameter if present, else default to 0.0

            return new OpticalSurface
            {
                R = R,
                t = t,
                n_after = n_after,
                n_before = 1.0,
                Diameter = diameter
            };
        }
    }

    // Represents an optical system (either the whole system or a lens subsystem)
    public class OpticalSystem
    {
        public string Name { get; set; }
        public List<OpticalSurface> RegularSurfaces { get; set; } = new List<OpticalSurface>();
        public List<OpticalSurface> ReversedSurfaces { get; set; } = new List<OpticalSurface>();
    }

    public static class AutocollimationCalculator
    {
        /// <summary>
        /// Computes the autocollimation distance (L) and angular magnification (γ)
        /// starting at a given surface index.
        /// </summary>
        public static (double L, double gamma) ComputeAutocollimation(List<OpticalSurface> surfaces, int startIndex, double initialH = 1.0)
        {
            double h = initialH;
            double R_start = surfaces[startIndex].R;
            double tan_alpha_initial = initialH / R_start;
            double tan_alpha = tan_alpha_initial;

            for (int j = startIndex; j < surfaces.Count; j++)
            {
                double n_before = surfaces[j].n_before;
                double n_after = surfaces[j].n_after;
                double R = surfaces[j].R;
                tan_alpha = tan_alpha * (n_before / n_after) + (h * (n_after - n_before)) / (R * n_after);
                if (j < surfaces.Count - 1)
                {
                    double d = surfaces[j].t;
                    h = h - d * tan_alpha;
                }
            }

            double L = (tan_alpha != 0) ? h / tan_alpha : double.PositiveInfinity;
            double n0 = surfaces[startIndex].n_after;
            double gamma = (tan_alpha_initial != 0) ? (tan_alpha / tan_alpha_initial) / n0 : double.PositiveInfinity;
            return (L, gamma);
        }

        // Helper to set the incoming refractive index for each surface.
        public static void SetRefractiveIndices(List<OpticalSurface> surfaces)
        {
            if (surfaces.Count > 0)
            {
                surfaces[0].n_before = 1.0; // Air before the first surface
                for (int i = 1; i < surfaces.Count; i++)
                {
                    surfaces[i].n_before = surfaces[i - 1].n_after;
                }
            }
        }

        /// <summary>
        /// Parses systems from a file (either sys.txt or sysR.txt).
        /// </summary>
        private static Dictionary<string, List<OpticalSurface>> ParseSystemsFromFile(string filePath, bool isReversed)
        {
            Dictionary<string, List<OpticalSurface>> systems = new Dictionary<string, List<OpticalSurface>>();
            using (StreamReader reader = new StreamReader(filePath))
            {
                string currentHeader = null;
                List<OpticalSurface> currentSurfaces = null;
                string line;
                while ((line = reader.ReadLine()) != null)
                {
                    line = line.Trim();
                    if (string.IsNullOrEmpty(line))
                        continue;
                    if (char.IsLetter(line[0]))  // It's a header
                    {
                        if (currentHeader != null && currentSurfaces != null)
                        {
                            systems[currentHeader] = currentSurfaces;
                        }
                        if (isReversed)
                        {
                            if (line == "Optical system reversed")
                                currentHeader = "Whole System";
                            else if (line.StartsWith("Lens ") && line.EndsWith(" reversed"))
                                currentHeader = line.Replace(" reversed", "");
                            else
                                currentHeader = null;
                        }
                        else
                        {
                            if (line == "Optical system")
                                currentHeader = "Whole System";
                            else if (line.StartsWith("Lens "))
                                currentHeader = line;
                            else
                                currentHeader = null;
                        }
                        if (currentHeader != null)
                        {
                            currentSurfaces = new List<OpticalSurface>();
                            reader.ReadLine(); // Skip column names (e.g., "Surface   R   t   n   D")
                        }
                    }
                    else if (currentHeader != null && char.IsDigit(line[0]))
                    {
                        try
                        {
                            OpticalSurface os = OpticalSurface.Parse(line);
                            currentSurfaces.Add(os);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error parsing line '{line}': {ex.Message}");
                        }
                    }
                }
                if (currentHeader != null && currentSurfaces != null)
                {
                    systems[currentHeader] = currentSurfaces;
                }
            }
            return systems;
        }

        /// <summary>
        /// Reads all optical systems from sys.txt and sysR.txt.
        /// </summary>
        public static List<OpticalSystem> ReadAllSystems()
        {
            string sysTxtPath = Path.Combine(Application.StartupPath, "sys.txt");
            string sysRTxtPath = Path.Combine(Application.StartupPath, "sysR.txt");
            if (!File.Exists(sysTxtPath) || !File.Exists(sysRTxtPath))
            {
                throw new FileNotFoundException("sys.txt or sysR.txt not found.");
            }

            var regularSystems = ParseSystemsFromFile(sysTxtPath, false);
            var reversedSystems = ParseSystemsFromFile(sysRTxtPath, true);

            List<OpticalSystem> opticalSystems = new List<OpticalSystem>();
            foreach (var key in regularSystems.Keys)
            {
                if (reversedSystems.ContainsKey(key))
                {
                    OpticalSystem os = new OpticalSystem
                    {
                        Name = key,
                        RegularSurfaces = regularSystems[key],
                        ReversedSurfaces = reversedSystems[key]
                    };
                    opticalSystems.Add(os);
                }
            }

            // Set n_before for all surfaces
            foreach (var system in opticalSystems)
            {
                SetRefractiveIndices(system.RegularSurfaces);
                SetRefractiveIndices(system.ReversedSurfaces);
            }

            return opticalSystems;
        }
    }

    // A form that displays the autocollimation calculation results.
    public partial class AutocollimationResultsForm : Form
    {
        private TextBox textBoxResults;

        public AutocollimationResultsForm()
        {
            this.Text = "Autocollimation Results";
            this.Width = 600;
            this.Height = 400;

            textBoxResults = new TextBox
            {
                Multiline = true,
                ScrollBars = ScrollBars.Vertical,
                Dock = DockStyle.Fill,
                ReadOnly = true
            };
            this.Controls.Add(textBoxResults);

            DisplayResults();
        }

        private void DisplayResults()
        {
            try
            {
                List<OpticalSystem> systems = AutocollimationCalculator.ReadAllSystems();
                StringBuilder sb = new StringBuilder();

                foreach (var system in systems)
                {
                    // Translate the system name: "Whole System" becomes "Оптическая система"
                    // and any "Lens ..." becomes "Линза ..." accordingly.
                    string systemNameTranslated = TranslateSystemName(system.Name);

                    // Use the Russian label for regular orientation.
                    sb.AppendLine(systemNameTranslated + " (в нормальной ориентации):");
                    if (system.RegularSurfaces.Count > 0)
                    {
                        for (int i = 0; i < system.RegularSurfaces.Count; i++)
                        {
                            var (L, gamma) = AutocollimationCalculator.ComputeAutocollimation(system.RegularSurfaces, i);
                            // "Surface" becomes "Поверхность"
                            sb.AppendLine($"Поверхность {i + 1}: L = {L:F3} mm, γ = {gamma:F4}");
                        }
                    }
                    else
                    {
                        sb.AppendLine("Нет данных для нормальной ориентации.");
                    }
                    sb.AppendLine();

                    // Use the Russian label for reversed orientation.
                    sb.AppendLine(systemNameTranslated + " (в обратной ориентации):");
                    if (system.ReversedSurfaces.Count > 0)
                    {
                        List<(double L, double gamma)> revResults = new List<(double, double)>();
                        for (int i = 0; i < system.ReversedSurfaces.Count; i++)
                        {
                            var result = AutocollimationCalculator.ComputeAutocollimation(system.ReversedSurfaces, i);
                            revResults.Add(result);
                        }
                        // Reverse the results so the surface numbering follows the optical path.
                        revResults.Reverse();
                        for (int i = 0; i < revResults.Count; i++)
                        {
                            sb.AppendLine($"Поверхность {i + 1}: L = {revResults[i].L:F3} mm, γ = {revResults[i].gamma:F4}");
                        }
                    }
                    else
                    {
                        sb.AppendLine("Нет данных для обратной ориентации.");
                    }
                    sb.AppendLine(new string('-', 50));
                }

                textBoxResults.Text = sb.ToString();
            }
            catch (Exception ex)
            {
                textBoxResults.Text = "Ошибка: " + ex.Message;
            }
        }

        private string TranslateSystemName(string originalName)
        {
            // If the system is the whole system, change it.
            if (originalName == "Whole System")
                return "Оптическая система";
            // If it starts with "Lens", replace with "Линза"
            else if (originalName.StartsWith("Lens"))
                return originalName.Replace("Lens", "Линза");
            else
                return originalName;
        }
    }
}