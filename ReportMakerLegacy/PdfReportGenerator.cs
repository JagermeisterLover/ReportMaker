using PdfSharp.Drawing;
using PdfSharp.Fonts;
using PdfSharp.Pdf;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Text;
using System.Windows.Forms;
using static System.Windows.Forms.AxHost;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;

namespace ReportMaker
{
    public class PdfReportGenerator
    {
        private readonly DataGridView dataGridViewLDE;
        private readonly List<Surface> regularSystem;
        private readonly List<Lens> regularLenses;
        private readonly string zmxFileName;
        private readonly double wavelength;

        public PdfReportGenerator(DataGridView dataGridView, List<Surface> regularSystem, List<Lens> regularLenses, string zmxFileName, double wavelength)
        {
            this.dataGridViewLDE = dataGridView;
            this.regularSystem = regularSystem;
            this.regularLenses = regularLenses;
            this.zmxFileName = zmxFileName ?? "Unknown";
            this.wavelength = wavelength;
        }

        public void GeneratePdfReport()
        {
            // Compute autocollimation results (translated)
            string calculationResults = ComputeAutocollimationResults();

            // Create PDF document
            PdfDocument document = new PdfDocument();
            document.Info.Title = "Отчёт по оптической системе"; // Translated title

            // Page 1: Table and System Drawing
            PdfPage page1 = document.AddPage();
            page1.Size = PdfSharp.PageSize.A4;
            XGraphics gfx1 = XGraphics.FromPdfPage(page1);
            DrawFirstPage(gfx1, page1);

            // Page 2: Calculation Results (translated)
            PdfPage page2 = document.AddPage();
            page2.Size = PdfSharp.PageSize.A4;
            XGraphics gfx2 = XGraphics.FromPdfPage(page2);
            DrawCalculationResults(gfx2, page2, calculationResults);

            // Subsequent Pages: Individual Lenses (3 per page)
            DrawLensPages(document);




            // Save and open the PDF in the Reports subfolder with an auto-incremented file name.
            string reportsFolder = "Reports";
            if (!Directory.Exists(reportsFolder))
            {
                Directory.CreateDirectory(reportsFolder);
            }

            // Get all PDF files that start with "opticalsystemreport" in the Reports folder.
            string[] existingFiles = Directory.GetFiles(reportsFolder, "opticalsystemreport*.pdf");
            int maxNumber = 0;
            foreach (string file in existingFiles)
            {
                string fileName = Path.GetFileNameWithoutExtension(file);
                // Expect file names like "opticalsystemreport1", "opticalsystemreport2", etc.
                string numberPart = fileName.Substring("opticalsystemreport".Length);
                if (int.TryParse(numberPart, out int fileNumber))
                {
                    if (fileNumber > maxNumber)
                        maxNumber = fileNumber;
                }
            }
            int newNumber = maxNumber + 1;
            string filename = Path.Combine(reportsFolder, $"opticalsystemreport{newNumber}.pdf");
            document.Save(filename);
            Process.Start(new ProcessStartInfo
            {
                FileName = filename,
                UseShellExecute = true
            });
        }




        private string ComputeAutocollimationResults()
        {
            List<OpticalSystem> systems = AutocollimationCalculator.ReadAllSystems();
            StringBuilder sb = new StringBuilder();

            foreach (var system in systems)
            {
                // Translate system name ("Whole System" and "Lens" labels)
                string translatedName = TranslateSystemName(system.Name);
                sb.AppendLine($"{translatedName} (в нормальной ориентации):");
                if (system.RegularSurfaces.Count > 0)
                {
                    for (int i = 0; i < system.RegularSurfaces.Count; i++)
                    {
                        var (L, gamma) = AutocollimationCalculator.ComputeAutocollimation(system.RegularSurfaces, i);
                        sb.AppendLine($"Поверхность {i + 1}: L = {L:F3} мм, γ = {gamma:F4}");
                    }
                }
                else
                {
                    sb.AppendLine("Нет данных для нормальной ориентации.");
                }
                sb.AppendLine();

                sb.AppendLine($"{translatedName} (в обратной ориентации):");
                if (system.ReversedSurfaces.Count > 0)
                {
                    List<(double L, double gamma)> revResults = new List<(double, double)>();
                    for (int i = 0; i < system.ReversedSurfaces.Count; i++)
                    {
                        var result = AutocollimationCalculator.ComputeAutocollimation(system.ReversedSurfaces, i);
                        revResults.Add(result);
                    }
                    revResults.Reverse();
                    for (int i = 0; i < revResults.Count; i++)
                    {
                        sb.AppendLine($"Поверхность {i + 1}: L = {revResults[i].L:F3} мм, γ = {revResults[i].gamma:F4}");
                    }
                }
                else
                {
                    sb.AppendLine("Нет данных для обратной ориентации.");
                }
                sb.AppendLine(new string('-', 50));
            }
            return sb.ToString();
        }

        private string TranslateSystemName(string originalName)
        {
            // If the system is the whole system, change it.
            if (originalName == "Whole System")
                return "Оптическая система, микроскоп справа";
            // If it starts with "Lens", replace with "Линза"
            else if (originalName.StartsWith("Lens"))
                return originalName.Replace("Lens", "Линза");
            else
                return originalName;
        }

        private void DrawFirstPage(XGraphics gfx, PdfPage page)
        {
            GlobalFontSettings.UseWindowsFontsUnderWindows = true;
            XFont tableFont = new XFont("Arial", 10);
            XFont titleFont = new XFont("Arial", 10);

            double x = 50;
            double y = 30;
            double rowHeight = 15;
            double colWidth = (page.Width - 140) / 7; // Adjusted from 6 to 7 columns (added MechDiameter)
            double verticalSpacing = 20; // Increased for better separation

            // Header
            string headerText = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} - {zmxFileName}";
            gfx.DrawString(headerText, titleFont, XBrushes.Black, x, y);
            y += rowHeight + verticalSpacing;

            // Wavelength
            CultureInfo commaCulture = CultureInfo.GetCultureInfo("ru-RU");
            string wavelengthText = $"Длина волны : {wavelength.ToString("F3", commaCulture)} мкм";
            gfx.DrawString(wavelengthText, titleFont, XBrushes.Black, x, y);
            y += rowHeight + verticalSpacing;

            // LDE table headers
            Dictionary<string, string> headerToPropertyMap = new Dictionary<string, string>
    {
        { "Радиус", "Radius" }, { "Толщина", "Thickness" }, { "Материал", "Material" },
        { "n", "RefractiveIndex" }, { "Диаметр", "Diameter" }, { "Мех. Диаметр", "MechDiameter" }
    };
            List<string> headers = new List<string> { "Радиус", "Толщина", "Материал", "n", "Диаметр", "Мех. Диаметр" };

            gfx.DrawString("№", tableFont, XBrushes.Black, x, y);
            double currentX = x + colWidth;
            foreach (string header in headers)
            {
                gfx.DrawString(header, tableFont, XBrushes.Black, currentX, y);
                currentX += colWidth;
            }
            y += rowHeight;

            // LDE table rows
            foreach (DataGridViewRow row in dataGridViewLDE.Rows)
            {
                if (row.IsNewRow) continue;
                string surfaceNumber = (row.Index + 1).ToString();
                gfx.DrawString(surfaceNumber, tableFont, XBrushes.Black, x, y);
                currentX = x + colWidth;

                foreach (string header in headers)
                {
                    string propertyName = headerToPropertyMap[header];
                    int colIndex = -1;
                    foreach (DataGridViewColumn col in dataGridViewLDE.Columns)
                    {
                        if (col.DataPropertyName == propertyName)
                        {
                            colIndex = col.Index;
                            break;
                        }
                    }

                    string value = colIndex != -1 ? row.Cells[colIndex].Value?.ToString() ?? "" : "";
                    if (propertyName == "Radius")
                    {
                        if (value == "Infinity") value = "∞";
                        else if (double.TryParse(value, out double rValue)) value = rValue.ToString("F5");
                    }
                    else if (propertyName == "Thickness" && double.TryParse(value, out double tValue))
                    {
                        value = tValue.ToString("F4");
                    }
                    else if (propertyName == "RefractiveIndex" && double.TryParse(value, out double nValue))
                    {
                        value = nValue.ToString("F6");
                    }
                    else if (propertyName == "Diameter" && double.TryParse(value, out double dValue))
                    {
                        value = dValue.ToString("F3");
                    }
                    else if (propertyName == "MechDiameter" && double.TryParse(value, out double mdValue))
                    {
                        value = mdValue.ToString("F3"); // Format MechDiameter to 3 decimal places
                    }
                    gfx.DrawString(value, tableFont, XBrushes.Black, currentX, y);
                    currentX += colWidth;
                }
                y += rowHeight;
            }

            // Draw system and get its height
            double drawingStartY = y + verticalSpacing;
            double drawingHeight = DrawSystem(gfx, regularSystem, page, drawingStartY);

            // Paraxial properties
            double paraxialStartY = drawingStartY + drawingHeight + verticalSpacing;
            double paraxialColWidth = (page.Width - 200) / 5;

            if (paraxialStartY + 75 > page.Height - 50)
            {
                page = page.Owner.AddPage();
                page.Size = PdfSharp.PageSize.A4;
                gfx = XGraphics.FromPdfPage(page);
                paraxialStartY = 50;
            }

            // Whole system properties
            ParaxialProperties wholeSystemProps = ComputeParaxialProperties(regularSystem);
            double L = regularSystem.Take(regularSystem.Count - 1).Sum(s => s.Thickness);

            gfx.DrawString("Параксиальные характеристики ОС:", titleFont, XBrushes.Black, x, paraxialStartY);
            paraxialStartY += rowHeight;

            currentX = x;
            string[] wholeSystemHeaders = { "f'", "SF", "SF'", "L" };
            foreach (string header in wholeSystemHeaders)
            {
                gfx.DrawString(header, tableFont, XBrushes.Black, currentX, paraxialStartY);
                currentX += paraxialColWidth;
            }
            paraxialStartY += rowHeight;

            currentX = x;
            string[] wholeSystemValues = {
        $"{wholeSystemProps.EFFL:F3}", $"{wholeSystemProps.BFL:F3}", $"{wholeSystemProps.FFL:F3}", $"{L:F3}"
    };
            foreach (string value in wholeSystemValues)
            {
                gfx.DrawString(value, tableFont, XBrushes.Black, currentX, paraxialStartY);
                currentX += paraxialColWidth;
            }
            paraxialStartY += rowHeight;

            // Individual lens properties
            if (paraxialStartY + 50 > page.Height - 50)
            {
                page = page.Owner.AddPage();
                page.Size = PdfSharp.PageSize.A4;
                gfx = XGraphics.FromPdfPage(page);
                paraxialStartY = 50;
            }

            gfx.DrawString("Параксиальные характеристики линз:", titleFont, XBrushes.Black, x, paraxialStartY);
            paraxialStartY += rowHeight;

            currentX = x;
            string[] lensHeaders = { "№", "f'", "SF", "SF'" };
            foreach (string header in lensHeaders)
            {
                gfx.DrawString(header, tableFont, XBrushes.Black, currentX, paraxialStartY);
                currentX += paraxialColWidth;
            }
            paraxialStartY += rowHeight;

            for (int i = 0; i < regularLenses.Count; i++)
            {
                if (paraxialStartY + rowHeight > page.Height - 50)
                {
                    page = page.Owner.AddPage();
                    page.Size = PdfSharp.PageSize.A4;
                    gfx = XGraphics.FromPdfPage(page);
                    paraxialStartY = 50;
                }

                List<Surface> lensSurfaces = new List<Surface> { regularLenses[i].Front, regularLenses[i].Back };
                ParaxialProperties lensProps = ComputeParaxialProperties(lensSurfaces);

                currentX = x;
                string[] lensValues = { $"{i + 1}", $"{lensProps.EFFL:F3}", $"{lensProps.BFL:F3}", $"{lensProps.FFL:F3}" };
                foreach (string value in lensValues)
                {
                    gfx.DrawString(value, tableFont, XBrushes.Black, currentX, paraxialStartY);
                    currentX += paraxialColWidth;
                }
                paraxialStartY += rowHeight;
            }
        }

        private double DrawSystem(XGraphics gfx, List<Surface> surfList, PdfPage page, double startY)
        {
            gfx.SmoothingMode = XSmoothingMode.AntiAlias;
            // Reserve extra top margin so the dimension line won't overlap the table.
            double drawingTopMargin = 40; // Adjust this value to increase the gap between the table and optical drawing.
            double drawingAreaTop = startY + drawingTopMargin;

            // Calculate system dimensions in mm
            List<double> xPositions = new List<double> { 0 };
            double cumulativeX = 0;
            for (int i = 0; i < surfList.Count - 1; i++)
            {
                cumulativeX += surfList[i].Thickness;
                xPositions.Add(cumulativeX);
            }
            double systemWidthMM = cumulativeX;
            double maxDiameterMM = surfList.Max(s => s.Diameter);

            // Fixed vertical drawing height (in points)
            double fixedDrawingHeight = 200; // Adjust this value as needed
            double scale = fixedDrawingHeight / maxDiameterMM;
            double drawingWidth = systemWidthMM * scale;
            double availableWidth = page.Width * 0.8;

            // Adjust scale if drawing is too wide
            if (drawingWidth > availableWidth)
            {
                scale = availableWidth / systemWidthMM;
                drawingWidth = availableWidth;
                fixedDrawingHeight = maxDiameterMM * scale;
            }
            double drawingHeight = fixedDrawingHeight;

            // Center the optical drawing horizontally.
            float offsetX = (float)((page.Width - (systemWidthMM * scale)) / 2);
            // Center the drawing vertically within its allocated drawing area.
            float offsetY = (float)(drawingAreaTop + drawingHeight / 2);

            // Define bounds for optical axis drawing.
            float minX = offsetX;
            float maxX = offsetX + (float)(systemWidthMM * scale);
            float axisStartX = minX - 20;
            float axisEndX = maxX + 20;

            // Draw the L dimension line.
            // Instead of drawing above startY (which might overlap the table),
            // we now draw it inside the reserved top margin.
            XFont dimFont = new XFont("Arial", 8);
            XBrush dimBrush = XBrushes.Black;
            XPen dimPen = new XPen(XColors.Black, 0.5);
            float arrowSize = 5;
            string dimLabel = $"L = {systemWidthMM:F3} мм";
            XSize labelSize = gfx.MeasureString(dimLabel, dimFont);

            // Place the dimension line halfway into the reserved margin.
            float dimY = (float)(startY + drawingTopMargin / 2);

            // Draw leader lines from the optical axis (offsetY) down to the dimension line (dimY).
            gfx.DrawLine(dimPen, minX, offsetY, minX, dimY);
            gfx.DrawLine(dimPen, maxX, offsetY, maxX, dimY);

            XPoint dimStart = new XPoint(minX, dimY);
            XPoint dimEnd = new XPoint(maxX, dimY);
            DrawArrowLine(gfx, dimStart, dimEnd, arrowSize);

            float textX = (minX + maxX - (float)labelSize.Width) / 2;
            float textY = dimY - (float)labelSize.Height - 5;
            gfx.DrawString(dimLabel, dimFont, dimBrush, textX, textY);

            // Draw the optical axis.
            XPen axisPen = new XPen(XColors.Black, 0.5)
            {
                DashStyle = XDashStyle.Custom,
                DashPattern = new double[] { 20, 14, 6, 14 } // Long dash (6), short gap (2), short dash (2), gap (2)
            };
            gfx.DrawLine(axisPen, axisStartX, offsetY, axisEndX, offsetY);

            // Draw the lenses.
            XPen thickPen = new XPen(XColors.Black, 1);
            for (int i = 0; i < surfList.Count - 1; i++)
            {
                if (surfList[i].RefractiveIndex > 1)
                {
                    Lens lens = new Lens { Front = surfList[i], Back = surfList[i + 1] };
                    DrawLens(gfx, lens, xPositions[i], xPositions[i + 1], scale, offsetX, offsetY, thickPen);
                }
            }

            // Return the total height used (drawing plus reserved top margin)
            return drawingHeight + drawingTopMargin;
        }

        private void DrawLens(XGraphics gfx, Lens lens, double frontX, double backX, double scale, float offsetX, float offsetY, XPen pen)
        {
            Console.WriteLine($"Front: D={lens.Front.Diameter}, MD={lens.Front.MechDiameter}");
            Console.WriteLine($"Back: D={lens.Back.Diameter}, MD={lens.Back.MechDiameter}");
           
            List<XPoint> frontUpper = GetSurfaceArcPoints(lens.Front, frontX, scale, offsetY, offsetX, true);
            List<XPoint> backUpper = GetSurfaceArcPoints(lens.Back, backX, scale, offsetY, offsetX, true);
            List<XPoint> frontLower = GetSurfaceArcPoints(lens.Front, frontX, scale, offsetY, offsetX, false);
            List<XPoint> backLower = GetSurfaceArcPoints(lens.Back, backX, scale, offsetY, offsetX, false);



            // Draw the optical surface arcs
            if (frontUpper.Count > 1) gfx.DrawLines(pen, frontUpper.ToArray());
            if (backUpper.Count > 1) gfx.DrawLines(pen, backUpper.ToArray());
            if (frontLower.Count > 1) gfx.DrawLines(pen, frontLower.ToArray());
            if (backLower.Count > 1) gfx.DrawLines(pen, backLower.ToArray());

            // Handle front surface mechanical edge
            XPoint frontUpperEnd = frontUpper[frontUpper.Count - 1];
            XPoint frontLowerEnd = frontLower[frontLower.Count - 1];
            double frontSemiD = lens.Front.Diameter / 2;
            double frontSemiMD = lens.Front.MechDiameter / 2;
            if (frontSemiMD > frontSemiD)
            {
                XPoint frontUpperMech = new XPoint(frontUpperEnd.X, offsetY - frontSemiMD * scale);
                XPoint frontLowerMech = new XPoint(frontLowerEnd.X, offsetY + frontSemiMD * scale);
                gfx.DrawLine(pen, frontUpperEnd, frontUpperMech);
                gfx.DrawLine(pen, frontLowerEnd, frontLowerMech);
                frontUpperEnd = frontUpperMech;
                frontLowerEnd = frontLowerMech;
            }

            // Handle back surface mechanical edge
            XPoint backUpperEnd = backUpper[backUpper.Count - 1];
            XPoint backLowerEnd = backLower[backLower.Count - 1];
            double backSemiD = lens.Back.Diameter / 2;
            double backSemiMD = lens.Back.MechDiameter / 2;
            if (backSemiMD > backSemiD)
            {
                XPoint backUpperMech = new XPoint(backUpperEnd.X, offsetY - backSemiMD * scale);
                XPoint backLowerMech = new XPoint(backLowerEnd.X, offsetY + backSemiMD * scale);
                gfx.DrawLine(pen, backUpperEnd, backUpperMech);
                gfx.DrawLine(pen, backLowerEnd, backLowerMech);
                backUpperEnd = backUpperMech;
                backLowerEnd = backLowerMech;
            }

            // Connect the lens edges (using mechanical diameter extents)
            double targetUpperY = Math.Min(frontUpperEnd.Y, backUpperEnd.Y);
            if (Math.Abs(frontUpperEnd.Y - targetUpperY) > 1)
            {
                gfx.DrawLine(pen, frontUpperEnd, new XPoint(frontUpperEnd.X, targetUpperY));
                frontUpperEnd.Y = targetUpperY;
            }
            if (Math.Abs(backUpperEnd.Y - targetUpperY) > 1)
            {
                gfx.DrawLine(pen, backUpperEnd, new XPoint(backUpperEnd.X, targetUpperY));
                backUpperEnd.Y = targetUpperY;
            }
            gfx.DrawLine(pen, frontUpperEnd, backUpperEnd);

            double targetLowerY = Math.Max(frontLowerEnd.Y, backLowerEnd.Y);
            if (Math.Abs(frontLowerEnd.Y - targetLowerY) > 1)
            {
                gfx.DrawLine(pen, frontLowerEnd, new XPoint(frontLowerEnd.X, targetLowerY));
                frontLowerEnd.Y = targetLowerY;
            }
            if (Math.Abs(backLowerEnd.Y - targetLowerY) > 1)
            {
                gfx.DrawLine(pen, backLowerEnd, new XPoint(backLowerEnd.X, targetLowerY));
                backLowerEnd.Y = targetLowerY;
            }
            gfx.DrawLine(pen, frontLowerEnd, backLowerEnd);
        }

        private List<XPoint> GetSurfaceArcPoints(Surface s, double vertexX, double scale, double centerY, float offsetX, bool upper, double? diameterOverride = null)
        {
            List<XPoint> pts = new List<XPoint>();
            int numPoints = 50;
            double usedDiameter = diameterOverride ?? s.Diameter; // Use MD if provided

            double semiDiam = usedDiameter / 2;
            double startY = 0;
            double endY = upper ? semiDiam : -semiDiam;
            for (int i = 0; i <= numPoints; i++)
            {
                double t = (double)i / numPoints;
                double y = startY + t * (endY - startY);
                double xOffset = 0;
                if (!double.IsInfinity(s.Radius))
                {
                    double R = s.Radius;
                    double radicand = R * R - y * y;
                    if (radicand >= 0)
                    {
                        xOffset = R > 0 ? R - Math.Sqrt(radicand) : R + Math.Sqrt(radicand);
                    }
                }
                double x = (vertexX + xOffset) * scale + offsetX;
                double yp = centerY - y * scale;
                pts.Add(new XPoint(x, yp));
            }
            return pts;
        }

        private void DrawCalculationResults(XGraphics gfx, PdfPage page, string results)
        {
            XFont font = new XFont("Arial", 8); // Changed to Arial
            double x = 50;
            double y = 50;
            double lineHeight = 15;
            string[] lines = results.Split(new[] { Environment.NewLine }, StringSplitOptions.None);

            foreach (string line in lines)
            {
                gfx.DrawString(line, font, XBrushes.Black, x, y);
                y += lineHeight;
                if (y > page.Height - 50)
                {
                    page = gfx.PdfPage.Owner.AddPage();
                    page.Size = PdfSharp.PageSize.A4;
                    gfx = XGraphics.FromPdfPage(page);
                    y = 50;
                }
            }
        }

        private void DrawLensPages(PdfDocument document)
        {
            int lensesPerPage = 3;
            // Define page margins
            float pageMarginLeft = 50;
            float pageMarginTop = 50;
            float pageMarginRight = 50;
            float pageMarginBottom = 50;

            for (int i = 0; i < regularLenses.Count; i += lensesPerPage)
            {
                PdfPage page = document.AddPage();
                page.Size = PdfSharp.PageSize.A4;
                XGraphics gfx = XGraphics.FromPdfPage(page);

                float usableWidth = (float)page.Width - pageMarginLeft - pageMarginRight;
                float usableHeight = (float)page.Height - pageMarginTop - pageMarginBottom;
                float sectionHeight = usableHeight / lensesPerPage;

                for (int j = 0; j < lensesPerPage && (i + j) < regularLenses.Count; j++)
                {
                    Lens lens = regularLenses[i + j];
                    RectangleF rect = new RectangleF(
                        pageMarginLeft,
                        pageMarginTop + j * sectionHeight,
                        usableWidth,
                        sectionHeight);
                    DrawIndividualLens(gfx, lens, rect, i + j + 1);
                }
            }
        }


        private void DrawIndividualLens(XGraphics gfx, Lens lens, RectangleF rect, int lensNumber)
        {
            gfx.SmoothingMode = XSmoothingMode.AntiAlias;

            int panelMargin = 20;
            double maxDiameter = Math.Max(lens.Front.Diameter, lens.Back.Diameter);
            float dimensionSpace = 120;

            // Unscaled points in mm
            List<XPoint> frontUpperMM = GetSurfaceArcPoints(lens.Front, 0, 1, 0, 0, true);
            List<XPoint> backUpperMM = GetSurfaceArcPoints(lens.Back, lens.Front.Thickness, 1, 0, 0, true);
            double edgeThickness = backUpperMM.Last().X - frontUpperMM.Last().X;

            double minX = double.MaxValue;
            double maxX = double.MinValue;
            foreach (var pt in frontUpperMM.Concat(backUpperMM))
            {
                if (pt.X < minX) minX = pt.X;
                if (pt.X > maxX) maxX = pt.X;
            }
            double lensWidthMM = maxX - minX;

            float rightMargin = 300; // Margin from the right edge
            double targetHeightMM = maxDiameter * 1;
            double scaleY = (rect.Height - 2 * panelMargin - dimensionSpace) / targetHeightMM;
            double scaleX = scaleY;
            float drawingWidth = (float)(lensWidthMM * scaleX);
            float offsetX = rect.Right - drawingWidth - rightMargin; // Align to the right
            float offsetY = rect.Top + panelMargin + (rect.Height - 2 * panelMargin - (float)(targetHeightMM * scaleY) - dimensionSpace) / 2 + (float)(maxDiameter * scaleY / 2);

            List<XPoint> frontUpper = GetSurfaceArcPoints(lens.Front, 0, scaleX, offsetY, offsetX, true);
            List<XPoint> frontLower = GetSurfaceArcPoints(lens.Front, 0, scaleX, offsetY, offsetX, false);
            List<XPoint> backUpper = GetSurfaceArcPoints(lens.Back, lens.Front.Thickness, scaleX, offsetY, offsetX, true);
            List<XPoint> backLower = GetSurfaceArcPoints(lens.Back, lens.Front.Thickness, scaleX, offsetY, offsetX, false);

            float minXPix = (float)frontUpper.Concat(frontLower).Concat(backUpper).Concat(backLower).Min(p => p.X);
            float maxXPix = (float)frontUpper.Concat(frontLower).Concat(backUpper).Concat(backLower).Max(p => p.X);

            XPen axisPen = new XPen(XColors.Black, 0.5)
            {
                DashStyle = XDashStyle.Custom,
                DashPattern = new double[] { 10, 8, 3, 8 }
            };
            gfx.DrawLine(axisPen, offsetX, offsetY, offsetX + drawingWidth, offsetY);

            XPen lensPen = new XPen(XColors.Black, 1);
            DrawLens(gfx, lens, 0, lens.Front.Thickness, scaleX, offsetX, offsetY, lensPen);

            DrawIndividualDimensions(gfx, lens, rect, scaleX, offsetX, offsetY, lensNumber, frontUpper, frontLower, backUpper, backLower, edgeThickness, lensWidthMM, minXPix, maxXPix);

            // Draw angles φ1 and φ2 to the right of the lens
            XFont font = new XFont("Arial", 8);
            float textX = rect.Right -100; // Position text to the right of the rectangle
            float textY = rect.Top + rect.Height / 2 - 100;
            gfx.DrawString("Angles:", font, XBrushes.Black, textX, textY);
            textY += 15;
            gfx.DrawString($"φ1 = {lens.Front.Phi:F4}", font, XBrushes.Black, textX, textY);
            textY += 15;
            gfx.DrawString($"φ2 = {lens.Back.Phi:F4}", font, XBrushes.Black, textX, textY);

            string orientationLabel = $"Линза {lensNumber}";
            gfx.DrawString(orientationLabel, new XFont("Arial", 8), XBrushes.Black, rect.Left + 10, rect.Top + 10);
        }

        private void DrawIndividualDimensions(XGraphics gfx, Lens lens, RectangleF rect, double scale, float offsetX, float offsetY, int lensNumber,
    List<XPoint> frontUpper, List<XPoint> frontLower, List<XPoint> backUpper, List<XPoint> backLower, double edgeThickness, double lensWidthMM, float minXPix, float maxXPix)
        {
            // Initialize drawing objects
            XFont dimFont = new XFont("Arial", 8);
            XBrush dimBrush = XBrushes.Black;
            XPen dimPen = new XPen(XColors.Black, 0.5);
            float textPadding = 5;
            float shelfSpacing = 30;
            float shelfLength = 50;
            float horizontalOffset = 60;
            float minShelfX = minXPix - horizontalOffset;

            // Calculate key positions
            float xFront = (float)frontUpper.First().X;
            float xBack = (float)backUpper.First().X;
            float maxLensY = (float)frontLower.Concat(backLower).Max(p => p.Y);
            float baseDimY = maxLensY + 20;

            // Define horizontal dimensions (thickness and edge)
            var dimensions = new List<(string Label, double Value, float StartX, float EndX)>
    {
        ($"Толщина по оси = {lens.Front.Thickness:F3} мм", lens.Front.Thickness, xFront, xBack),
        ($"Толщина края = {edgeThickness:F3} мм", edgeThickness, (float)frontLower.Last().X, (float)backLower.Last().X)
    };

            // Add lens width for meniscus lenses
            bool isMeniscus = (lens.Front.Radius > 0 && lens.Back.Radius > 0) || (lens.Front.Radius < 0 && lens.Back.Radius < 0);
            if (isMeniscus)
            {
                dimensions.Add(($"Полнота = {lensWidthMM:F3} мм", lensWidthMM, minXPix, maxXPix));
            }

            // Draw horizontal dimensions
            for (int i = 0; i < dimensions.Count; i++)
            {
                string label = dimensions[i].Label;
                float startX = dimensions[i].StartX;
                float endX = dimensions[i].EndX;
                float dimY = baseDimY + i * shelfSpacing;

                // Draw vertical extension lines
                if (i == 0)
                {
                    gfx.DrawLine(dimPen, startX, offsetY, startX, dimY);
                    gfx.DrawLine(dimPen, endX, offsetY, endX, dimY);
                }
                else if (i == 1)
                {
                    float frontEdgeY = (float)frontLower.Last().Y;
                    float backEdgeY = (float)backLower.Last().Y;
                    gfx.DrawLine(dimPen, startX, frontEdgeY, startX, dimY);
                    gfx.DrawLine(dimPen, endX, backEdgeY, endX, dimY);
                }
                else
                {
                    var allPoints = frontUpper.Concat(frontLower).Concat(backUpper).Concat(backLower).ToList();
                    var leftMost = allPoints.OrderBy(p => p.X).First();
                    var rightMost = allPoints.OrderByDescending(p => p.X).First();
                    gfx.DrawLine(dimPen, startX, leftMost.Y, startX, dimY);
                    gfx.DrawLine(dimPen, endX, rightMost.Y, endX, dimY);
                }

                // Draw dimension line with arrows
                XPoint dimStart = new XPoint(startX, dimY);
                XPoint dimEnd = new XPoint(endX, dimY);
                DrawArrowLine(gfx, dimStart, dimEnd, 5);

                // Draw shelf and label
                float shelfXEnd = Math.Min(startX, endX) - shelfLength;
                gfx.DrawLine(dimPen, Math.Min(startX, endX), dimY, shelfXEnd, dimY);

                XSize labelSize = gfx.MeasureString(label, dimFont);
                float textX = shelfXEnd - (float)labelSize.Width - textPadding;
                float textY = dimY - (float)labelSize.Height / 2;
                gfx.DrawString(label, dimFont, dimBrush, textX, textY);
            }

            // Define horizontal offset for diameter labels
            float labelHorizontalOffset = -5;

            // Draw diameters for front surface
            XPoint frontTopD = frontUpper.Last();
            XPoint frontBottomD = frontLower.Last();
            XPoint frontTopMD = new XPoint(frontUpper.Last().X, offsetY - (lens.Front.MechDiameter / 2) * scale);
            XPoint frontBottomMD = new XPoint(frontLower.Last().X, offsetY + (lens.Front.MechDiameter / 2) * scale);
            float frontDimX_D = xFront - 30;
            float frontDimX_MD = xFront - 60;
            DrawDiameter(gfx, lens.Front.Diameter, lens.Front.MechDiameter, frontTopD, frontBottomD, frontTopMD, frontBottomMD,
                         frontDimX_D, frontDimX_MD, dimPen, dimFont, dimBrush, -90, offsetY, labelHorizontalOffset, true, true);

            // Determine if optical and mechanical labels should be drawn for back surface
            bool drawBackOpticalLabel = Math.Abs(lens.Front.Diameter - lens.Back.Diameter) >= 0.001;
            bool drawBackMechLabel = Math.Abs(lens.Front.MechDiameter - lens.Back.MechDiameter) >= 0.001;

            // Draw diameters for back surface
            XPoint backTopD = backUpper.Last();
            XPoint backBottomD = backLower.Last();
            XPoint backTopMD = new XPoint(backUpper.Last().X, offsetY - (lens.Back.MechDiameter / 2) * scale);
            XPoint backBottomMD = new XPoint(backLower.Last().X, offsetY + (lens.Back.MechDiameter / 2) * scale);
            float backDimX_D = xBack + 30;
            float backDimX_MD = xBack + 60;
            DrawDiameter(gfx, lens.Back.Diameter, lens.Back.MechDiameter, backTopD, backBottomD, backTopMD, backBottomMD,
                         backDimX_D, backDimX_MD, dimPen, dimFont, dimBrush, -90, offsetY, labelHorizontalOffset, drawBackOpticalLabel, drawBackMechLabel);
            // Define the angle (20 degrees in radians)
            double theta = 10 * Math.PI / 180;

            // Front surface radius
            XPoint arcPointFront = frontUpper[frontUpper.Count / 2];
            float x_start_front = xFront - 75;
            double dx_front = arcPointFront.X - x_start_front;
            double dy_front = dx_front * Math.Tan(theta);
            float y_start_front = (float)(arcPointFront.Y - dy_front);
            string frontRadiusLabel = $"R A = {lens.Front.Radius:F3} мм";
            XSize frontRadiusSize = gfx.MeasureString(frontRadiusLabel, dimFont);
            gfx.DrawString(frontRadiusLabel, dimFont, dimBrush,
                x_start_front - (float)frontRadiusSize.Width,
                y_start_front - (float)frontRadiusSize.Height / 2);
            DrawLeaderLine(gfx, new XPoint(x_start_front, y_start_front), arcPointFront, 5);

            // Back surface radius
            XPoint arcPointBack = backUpper[backUpper.Count / 2];
            float x_start_back = xBack + 75;
            double dx_back = x_start_back - arcPointBack.X;
            double dy_back = dx_back * Math.Tan(theta);
            float y_start_back = (float)(arcPointBack.Y - dy_back);
            string backRadiusLabel = $"R Б = {lens.Back.Radius:F3} мм";
            XSize backRadiusSize = gfx.MeasureString(backRadiusLabel, dimFont);
            gfx.DrawString(backRadiusLabel, dimFont, dimBrush,
                x_start_back,
                y_start_back - (float)backRadiusSize.Height / 2);
            DrawLeaderLine(gfx, new XPoint(x_start_back, y_start_back), arcPointBack, 5);

            string orientationLabel = $"Линза {lensNumber}";
            gfx.DrawString(orientationLabel, new XFont("Arial", 8), XBrushes.Black, rect.Left + 10, rect.Top + 10);
        }



        private void DrawDiameter(XGraphics gfx, double diameter, double mechDiameter,
    XPoint topD, XPoint bottomD, XPoint topMD, XPoint bottomMD,
    float dimX_D, float dimX_MD, XPen dimPen, XFont dimFont, XBrush dimBrush,
    double rotationAngle, float offsetY, float labelHorizontalOffset, bool drawOpticalLabel, bool drawMechLabel)
        {
            float arrowSize = 5;
            bool sameDiameter = Math.Abs(diameter - mechDiameter) < 0.001;

            // Draw optical diameter label if requested
            if (drawOpticalLabel)
            {
                XPoint effectiveTop = topD;
                XPoint effectiveBottom = bottomD;
                float effectiveDimX = dimX_D;

                // Draw dimension lines for optical diameter
                gfx.DrawLine(dimPen, effectiveTop.X, effectiveTop.Y, effectiveDimX, effectiveTop.Y);
                gfx.DrawLine(dimPen, effectiveBottom.X, effectiveBottom.Y, effectiveDimX, effectiveBottom.Y);
                gfx.DrawLine(dimPen, effectiveDimX, effectiveTop.Y, effectiveDimX, effectiveBottom.Y);
                DrawArrow(gfx, new XPoint(effectiveDimX, effectiveTop.Y), new XPoint(effectiveDimX, effectiveTop.Y + arrowSize), arrowSize);
                DrawArrow(gfx, new XPoint(effectiveDimX, effectiveBottom.Y), new XPoint(effectiveDimX, effectiveBottom.Y - arrowSize), arrowSize);

                // Draw optical diameter label
                string diameterLabel = $"Ø {diameter:F3} мм";
                XSize diameterSize = gfx.MeasureString(diameterLabel, dimFont);
                float textWidth = (float)diameterSize.Width;
                float tx = rotationAngle > 0 ? effectiveDimX - labelHorizontalOffset : effectiveDimX + labelHorizontalOffset;
                float ty = rotationAngle > 0 ? offsetY - textWidth / 2 : offsetY + textWidth / 2;
                gfx.Save();
                gfx.TranslateTransform(tx, ty);
                gfx.RotateTransform(rotationAngle);
                gfx.DrawString(diameterLabel, dimFont, dimBrush, new XPoint(0, 0));
                gfx.Restore();
            }

            // Draw mechanical diameter label if requested and different from optical diameter
            if (drawMechLabel && !sameDiameter && mechDiameter > 0)
            {
                // Draw dimension lines for mechanical diameter
                gfx.DrawLine(dimPen, topMD.X, topMD.Y, dimX_MD, topMD.Y);
                gfx.DrawLine(dimPen, bottomMD.X, bottomMD.Y, dimX_MD, bottomMD.Y);
                gfx.DrawLine(dimPen, dimX_MD, topMD.Y, dimX_MD, bottomMD.Y);
                DrawArrow(gfx, new XPoint(dimX_MD, topMD.Y), new XPoint(dimX_MD, topMD.Y + arrowSize), arrowSize);
                DrawArrow(gfx, new XPoint(dimX_MD, bottomMD.Y), new XPoint(dimX_MD, bottomMD.Y - arrowSize), arrowSize);

                // Draw mechanical diameter label
                string mechDiameterLabel = $"Ø {mechDiameter:F3} мм";
                XSize mechDiameterSize = gfx.MeasureString(mechDiameterLabel, dimFont);
                float mechTextWidth = (float)mechDiameterSize.Width;
                float mechTx = rotationAngle > 0 ? dimX_MD - labelHorizontalOffset : dimX_MD + labelHorizontalOffset;
                float mechTy = rotationAngle > 0 ? offsetY - mechTextWidth / 2 : offsetY + mechTextWidth / 2;
                gfx.Save();
                gfx.TranslateTransform(mechTx, mechTy);
                gfx.RotateTransform(rotationAngle);
                gfx.DrawString(mechDiameterLabel, dimFont, dimBrush, new XPoint(0, 0));
                gfx.Restore();
            }
        }






        private void DrawLeaderLine(XGraphics gfx, XPoint start, XPoint end, float arrowSize)
        {
            XPen pen = new XPen(XColors.Black, 0.5);
            gfx.DrawLine(pen, start, end);
            DrawArrow(gfx, end, start, arrowSize); // Arrow at the end
        }

        private void DrawArrowLine(XGraphics gfx, XPoint pt1, XPoint pt2, float arrowSize)
        {
            XPen pen = new XPen(XColors.Black, 0.5);
            gfx.DrawLine(pen, pt1, pt2);

            // Calculate the length of the dimension line in points
            double dx = pt2.X - pt1.X;
            double dy = pt2.Y - pt1.Y;
            double length = Math.Sqrt(dx * dx + dy * dy);

            // Threshold for switching to inward arrows (small dimensions)
            float threshold = 4 * arrowSize; // e.g., 10 points if arrowSize = 5

            if (length < threshold && dy == 0) // Horizontal, small length
            {

                DrawArrow(gfx, pt1, new XPoint(pt1.X - 1, pt1.Y), arrowSize); // Left at pt1
                DrawArrow(gfx, pt2, new XPoint(pt2.X + 1, pt2.Y), arrowSize); // Right at pt2
            }
            else if (length < threshold && dx == 0) // Vertical, small length
            {


                DrawArrow(gfx, pt1, new XPoint(pt1.X, pt1.Y - 1), arrowSize); // Up at pt1 (top)
                DrawArrow(gfx, pt2, new XPoint(pt2.X, pt2.Y + 1), arrowSize); // Down at pt2 (bottom)
            }
            else
            {
                // Default: Arrows point inward
                if (dy == 0) // Horizontal
                {
                    // Arrows point 
                    DrawArrow(gfx, pt1, new XPoint(pt1.X + 1, pt1.Y), arrowSize); // Right at pt1
                    DrawArrow(gfx, pt2, new XPoint(pt2.X - 1, pt2.Y), arrowSize); // Left at pt2
                }
                else // Vertical
                {
                    DrawArrow(gfx, pt1, new XPoint(pt1.X, pt1.Y - 1), arrowSize); // Up at pt1 (top)
                    DrawArrow(gfx, pt2, new XPoint(pt2.X, pt2.Y + 1), arrowSize); // Down at pt2 (bottom)
                }
            }
        }

        private void DrawArrow(XGraphics gfx, XPoint from, XPoint to, float arrowSize)
        {
            double dx = to.X - from.X;
            double dy = to.Y - from.Y;
            double length = Math.Sqrt(dx * dx + dy * dy);
            if (length == 0) return;

            // Normalize direction vector
            dx /= length;
            dy /= length;

            // Reverse direction for outward-pointing arrows: arrow points from 'to' toward 'from'
            XPoint arrowPoint1 = new XPoint(
                from.X + arrowSize * dx + arrowSize * dy / 2,
                from.Y + arrowSize * dy - arrowSize * dx / 2
            );
            XPoint arrowPoint2 = new XPoint(
                from.X + arrowSize * dx - arrowSize * dy / 2,
                from.Y + arrowSize * dy + arrowSize * dx / 2
            );

            gfx.DrawPolygon(XBrushes.Black, new XPoint[] { from, arrowPoint1, arrowPoint2 }, XFillMode.Winding);
        }

        private Matrix2x2 ComputeABCDMatrix(List<Surface> surfaces, double n0 = 1.0)
        {
            Matrix2x2 M = new Matrix2x2(1, 0, 0, 1);
            double n_prev = n0;
            for (int k = 0; k < surfaces.Count; k++)
            {
                Surface s = surfaces[k];
                double R = s.Radius;
                double n_next = s.RefractiveIndex;
                double P = (R == 0 || double.IsInfinity(R)) ? 0 : (n_next - n_prev) / R; // Optical power
                Matrix2x2 M_ref = new Matrix2x2(1, 0, -P, 1); // Standard refraction matrix
                M = M * M_ref;
                if (k < surfaces.Count - 1)
                {
                    double d = s.Thickness;
                    if (d != 0)
                    {
                        Matrix2x2 M_trans = new Matrix2x2(1, d / n_next, 0, 1);
                        M = M * M_trans;
                    }
                }
                n_prev = n_next;
            }
            return M;
        }

        private ParaxialProperties ComputeParaxialProperties(List<Surface> surfaces)
        {
            Matrix2x2 M = ComputeABCDMatrix(surfaces);
            double A = M.A;
            double B = M.B;
            double C = M.C;
            double D = M.D;
            double effl = (C != 0) ? -1 / C : double.PositiveInfinity;
            double bfl = (C != 0) ? A / C : double.NaN; // Changed from -A/C to A/C
            double ffl = (C != 0) ? -D / C : double.NaN;
            return new ParaxialProperties { EFFL = effl, BFL = bfl, FFL = ffl };
        }


    }

    public struct Matrix2x2
    {
        public double A, B, C, D;

        public Matrix2x2(double a, double b, double c, double d)
        {
            A = a;
            B = b;
            C = c;
            D = d;
        }

        public static Matrix2x2 operator *(Matrix2x2 m1, Matrix2x2 m2)
        {
            return new Matrix2x2(
                m1.A * m2.A + m1.B * m2.C,
                m1.A * m2.B + m1.B * m2.D,
                m1.C * m2.A + m1.D * m2.C,
                m1.C * m2.B + m1.D * m2.D
            );
        }
    }

    public class ParaxialProperties
    {
        public double EFFL { get; set; }
        public double BFL { get; set; }
        public double FFL { get; set; }
    }

    


}