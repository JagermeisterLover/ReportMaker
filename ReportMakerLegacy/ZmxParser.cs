using System;
using System.Collections.Generic;
using System.Globalization;

namespace ReportMaker
{
    public static class ZmxParser
    {
        public static List<Surface> Parse(string[] lines)
        {
            List<Surface> surfaceList = new List<Surface>();
            Surface currentSurface = null;
            foreach (string line in lines)
            {
                string trimmed = line.Trim();
                if (trimmed.StartsWith("SURF"))
                {
                    currentSurface = new Surface();
                    surfaceList.Add(currentSurface);
                }
                else if (currentSurface != null)
                {
                    // Existing parsing logic...
                    if (trimmed.StartsWith("CURV"))
                    {
                        string[] tokens = trimmed.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                        if (tokens.Length > 1 &&
                            double.TryParse(tokens[1], NumberStyles.Float, CultureInfo.InvariantCulture,
                                out double curvature))
                        {
                            currentSurface.Radius =
                                (Math.Abs(curvature) < 1e-12) ? double.PositiveInfinity : 1.0 / curvature;
                        }
                    }
                    else if (trimmed.StartsWith("DISZ"))
                    {
                        string[] tokens = trimmed.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                        if (tokens.Length > 1)
                        {
                            if (tokens[1].Equals("INFINITY", StringComparison.OrdinalIgnoreCase))
                                currentSurface.Thickness = double.PositiveInfinity;
                            else if (double.TryParse(tokens[1], NumberStyles.Float, CultureInfo.InvariantCulture,
                                        out double thickness))
                                currentSurface.Thickness = thickness;
                        }
                    }
                    else if (trimmed.StartsWith("DIAM"))
                    {
                        string[] tokens = trimmed.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                        if (tokens.Length > 1 &&
                            double.TryParse(tokens[1], NumberStyles.Float, CultureInfo.InvariantCulture,
                                out double semiDiam))
                        {
                            currentSurface.SemiDiameter = semiDiam;
                        }
                    }
                    else if (trimmed.StartsWith("GLAS"))
                    {
                        string[] tokens = trimmed.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                        if (tokens.Length > 1)
                        {
                            currentSurface.Material = tokens[1];
                        }
                    }
                    // New parsing for MEMA
                    else if (trimmed.StartsWith("MEMA"))
                    {
                        string[] tokens = trimmed.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                        if (tokens.Length > 1 &&
                            double.TryParse(tokens[1], NumberStyles.Float, CultureInfo.InvariantCulture,
                                out double mechHeight))
                        {
                            currentSurface.MechHeight = mechHeight;
                        }
                    }
                }
            }

            return surfaceList;
        }
    }
}