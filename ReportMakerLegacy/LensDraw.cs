using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;

namespace ReportMaker
{
    public class LensDrawingForm : Form
    {
        private List<Surface> regularSystem;
        private List<Surface> reversedSystem;
        private List<Lens> regularLenses;
        private List<Lens> reversedLenses;

        private TabControl tabControl;
        private TabPage tabPageSystem;
        private Panel panelRegular;
        private Panel panelReversed;

        public LensDrawingForm(List<Surface> regularSystem, List<Surface> reversedSystem, List<Lens> regularLenses,
            List<Lens> reversedLenses)
        {
            this.regularSystem = regularSystem;
            this.reversedSystem = reversedSystem;
            this.regularLenses = regularLenses;
            this.reversedLenses = reversedLenses;
            InitializeComponents();

            // Add tabs for each lens pair (Lens 1, Lens 2, Lens 3, etc.)
            for (int i = 0; i < regularLenses.Count; i++)
            {
                TabPage tabPageLens = new TabPage($"Lens {i + 1}");
                SplitContainer splitContainerLens = new SplitContainer
                {
                    Dock = DockStyle.Fill,
                    Orientation = Orientation.Horizontal
                };

                Panel panelRegularLens = new Panel
                {
                    Dock = DockStyle.Fill,
                    BackColor = Color.White,
                    Tag = new { Lens = regularLenses[i], LensNumber = i + 1, IsReversed = false }
                };
                panelRegularLens.Paint += PanelLens_Paint;

                Panel panelReversedLens = new Panel
                {
                    Dock = DockStyle.Fill,
                    BackColor = Color.White,
                    Tag = new { Lens = reversedLenses[i], LensNumber = i + 1, IsReversed = true }
                };
                panelReversedLens.Paint += PanelLens_Paint;

                splitContainerLens.Panel1.Controls.Add(panelRegularLens);
                splitContainerLens.Panel2.Controls.Add(panelReversedLens);
                tabPageLens.Controls.Add(splitContainerLens);
                tabControl.TabPages.Add(tabPageLens);
            }
        }

        private void InitializeComponents()
        {
            this.Text = "Lens Drawing";
            this.Width = 800;
            this.Height = 600;

            tabControl = new TabControl
            {
                Dock = DockStyle.Fill
            };

            tabPageSystem = new TabPage("Optical System");
            SplitContainer splitContainer = new SplitContainer
            {
                Dock = DockStyle.Fill,
                Orientation = Orientation.Horizontal
            };

            panelRegular = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = Color.White
            };
            panelRegular.Paint += PanelRegular_Paint;

            panelReversed = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = Color.White
            };
            panelReversed.Paint += PanelReversed_Paint;

            splitContainer.Panel1.Controls.Add(panelRegular);
            splitContainer.Panel2.Controls.Add(panelReversed);
            tabPageSystem.Controls.Add(splitContainer);

            tabControl.TabPages.Add(tabPageSystem);
            this.Controls.Add(tabControl);
        }

        /// <summary>
        /// Adjusts the SplitterDistance for all SplitContainers after the form loads to ensure equal panel heights.
        /// </summary>
        protected override void OnLoad(EventArgs e)
        {
            base.OnLoad(e);
            foreach (TabPage tabPage in tabControl.TabPages)
            {
                if (tabPage.Controls.Count > 0 && tabPage.Controls[0] is SplitContainer splitContainer)
                {
                    splitContainer.SplitterDistance = splitContainer.Height / 2;
                }
            }
        }

        /// <summary>
        /// Paints the regular optical system (top panel).
        /// </summary>
        private void PanelRegular_Paint(object sender, PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.Clear(Color.White); // Clear the panel before drawing
            DrawSystem(g, regularSystem, panelRegular);
        }

        /// <summary>
        /// Paints the reversed optical system (bottom panel).
        /// </summary>
        private void PanelReversed_Paint(object sender, PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.Clear(Color.White); // Clear the panel before drawing
            DrawSystem(g, reversedSystem, panelReversed);
        }

        /// <summary>
        /// Common method to draw a system (regular or reversed).
        /// </summary>
        private void DrawSystem(Graphics g, List<Surface> surfList, Panel panel)
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;

            // Calculate horizontal positions
            List<double> xPositions = new List<double> { 0 };
            double cumulativeX = 0;
            for (int i = 0; i < surfList.Count - 1; i++)
            {
                cumulativeX += surfList[i].Thickness;
                xPositions.Add(cumulativeX);
            }
            double systemWidthMM = cumulativeX;

            // Calculate maximum vertical extent (diameter)
            double maxDiameterMM = 0;
            foreach (var surface in surfList)
            {
                if (surface.Diameter > maxDiameterMM)
                    maxDiameterMM = surface.Diameter;
            }
            double targetHeightMM = maxDiameterMM * 1.3; // 1.3 times max vertical dimension

            // Compute scaling to fit both dimensions
            double effectiveWidth = panel.Width * 0.8;  // 80% of panel width
            double effectiveHeight = panel.Height * 0.8; // 80% of panel height
            double scaleX = systemWidthMM > 0 ? effectiveWidth / systemWidthMM : 1;
            double scaleY = targetHeightMM > 0 ? effectiveHeight / targetHeightMM : 1;
            double scale = Math.Min(scaleX, scaleY);

            float offsetX = (float)((panel.Width - (systemWidthMM * scale)) / 2);
            float offsetY = panel.Height / 2;

            using (Pen axisPen = new Pen(Color.Gray, 1) { DashStyle = DashStyle.Dash })
            {
                g.DrawLine(axisPen, 0, offsetY, panel.Width, offsetY);
            }

            using (Pen thickPen = new Pen(Color.Black, 3))
            {
                for (int i = 0; i < surfList.Count - 1; i++)
                {
                    if (surfList[i].RefractiveIndex > 1)
                    {
                        Lens lens = new Lens { Front = surfList[i], Back = surfList[i + 1] };
                        DrawLens(g, lens, xPositions[i], xPositions[i + 1], scale, offsetX, offsetY, thickPen, false);
                    }
                }
            }
        }

        /// <summary>
        /// Paints an individual lens in its tab.
        /// </summary>
        private void PanelLens_Paint(object sender, PaintEventArgs e)
        {
            Panel panel = sender as Panel;
            var tag = panel.Tag as dynamic;
            if (tag != null)
            {
                Lens lens = tag.Lens;
                int lensNumber = tag.LensNumber;
                bool isReversed = tag.IsReversed;
                Graphics g = e.Graphics;
                g.SmoothingMode = SmoothingMode.AntiAlias;
                Rectangle rect = panel.ClientRectangle;
                DrawIndividualLens(g, lens, rect, lensNumber, isReversed);
            }
        }

        /// <summary>
        /// Draws a lens in the optical system view.
        /// </summary>
        private void DrawLens(Graphics g, Lens lens, double frontX, double backX, double scale, float offsetX,
            float offsetY, Pen pen, bool drawDimensions)
        {
            List<PointF> frontUpper = GetSurfaceArcPoints(lens.Front, frontX, scale, offsetY, offsetX, true);
            List<PointF> backUpper = GetSurfaceArcPoints(lens.Back, backX, scale, offsetY, offsetX, true);
            List<PointF> frontLower = GetSurfaceArcPoints(lens.Front, frontX, scale, offsetY, offsetX, false);
            List<PointF> backLower = GetSurfaceArcPoints(lens.Back, backX, scale, offsetY, offsetX, false);

            if (frontUpper.Count > 1) g.DrawLines(pen, frontUpper.ToArray());
            if (backUpper.Count > 1) g.DrawLines(pen, backUpper.ToArray());
            if (frontLower.Count > 1) g.DrawLines(pen, frontLower.ToArray());
            if (backLower.Count > 1) g.DrawLines(pen, backLower.ToArray());

            PointF frontUpperEnd = frontUpper[frontUpper.Count - 1];
            PointF backUpperEnd = backUpper[backUpper.Count - 1];
            float targetUpperY = Math.Min(frontUpperEnd.Y, backUpperEnd.Y);
            if (Math.Abs(frontUpperEnd.Y - targetUpperY) > 1)
            {
                g.DrawLine(pen, frontUpperEnd, new PointF(frontUpperEnd.X, targetUpperY));
                frontUpperEnd.Y = targetUpperY;
            }

            if (Math.Abs(backUpperEnd.Y - targetUpperY) > 1)
            {
                g.DrawLine(pen, backUpperEnd, new PointF(backUpperEnd.X, targetUpperY));
                backUpperEnd.Y = targetUpperY;
            }

            g.DrawLine(pen, frontUpperEnd, backUpperEnd);

            PointF frontLowerEnd = frontLower[frontLower.Count - 1];
            PointF backLowerEnd = backLower[backLower.Count - 1];
            float targetLowerY = Math.Max(frontLowerEnd.Y, backLowerEnd.Y);
            if (Math.Abs(frontLowerEnd.Y - targetLowerY) > 1)
            {
                g.DrawLine(pen, frontLowerEnd, new PointF(frontLowerEnd.X, targetLowerY));
                frontLowerEnd.Y = targetLowerY;
            }

            if (Math.Abs(backLowerEnd.Y - targetLowerY) > 1)
            {
                g.DrawLine(pen, backLowerEnd, new PointF(backLowerEnd.X, targetLowerY));
                backLowerEnd.Y = targetLowerY;
            }

            g.DrawLine(pen, frontLowerEnd, backLowerEnd);
        }

        private void DrawIndividualLens(Graphics g, Lens lens, Rectangle rect, int lensNumber, bool isReversed)
        {
            g.Clear(Color.White); // Ensure the background is cleared
            g.SmoothingMode = SmoothingMode.AntiAlias;

            int panelMargin = 20;
            double maxDiameter = Math.Max(lens.Front.Diameter, lens.Back.Diameter);
            float dimensionSpace = 120; // Increased slightly to accommodate more spacing

            // Calculate points with scale=1 for mm values (unscaled coordinates)
            List<PointF> frontUpperMM = GetSurfaceArcPoints(lens.Front, 0, 1, 0, 0, true);
            List<PointF> frontLowerMM = GetSurfaceArcPoints(lens.Front, 0, 1, 0, 0, false);
            List<PointF> backUpperMM = GetSurfaceArcPoints(lens.Back, lens.Front.Thickness, 1, 0, 0, true);
            List<PointF> backLowerMM = GetSurfaceArcPoints(lens.Back, lens.Front.Thickness, 1, 0, 0, false);

            // Calculate edge thickness
            double edgeThickness = backUpperMM.Last().X - frontUpperMM.Last().X;

            // Calculate minX and maxX in mm for lens width
            double minX = double.MaxValue;
            double maxX = double.MinValue;
            foreach (var pt in frontUpperMM.Concat(frontLowerMM).Concat(backUpperMM).Concat(backLowerMM))
            {
                if (pt.X < minX) minX = pt.X;
                if (pt.X > maxX) maxX = pt.X;
            }
            double lensWidthMM = maxX - minX;

            // New scaling: Canvas height = 1.5x max diameter
            double targetHeightMM = maxDiameter * 1;
            double scaleY = (rect.Height - 2 * panelMargin - dimensionSpace) / targetHeightMM;
            double scaleX = scaleY; // Maintain aspect ratio
            float drawingWidth = (float)(lensWidthMM * scaleX);
            float drawingHeight = (float)(targetHeightMM * scaleY);

            // Center the lens in the panel
            float offsetX = rect.Left + (rect.Width - drawingWidth) / 2;
            float offsetY = rect.Top + (rect.Height - drawingHeight - dimensionSpace) / 2 + (float)(maxDiameter * scaleY / 2);

            // Calculate scaled points for drawing
            List<PointF> frontUpper = GetSurfaceArcPoints(lens.Front, 0, scaleX, offsetY, offsetX, true);
            List<PointF> frontLower = GetSurfaceArcPoints(lens.Front, 0, scaleX, offsetY, offsetX, false);
            List<PointF> backUpper = GetSurfaceArcPoints(lens.Back, lens.Front.Thickness, scaleX, offsetY, offsetX, true);
            List<PointF> backLower = GetSurfaceArcPoints(lens.Back, lens.Front.Thickness, scaleX, offsetY, offsetX, false);

            // Find minXPix and maxXPix for dimension placement
            float minXPix = float.MaxValue;
            float maxXPix = float.MinValue;
            foreach (var pt in frontUpper.Concat(frontLower).Concat(backUpper).Concat(backLower))
            {
                if (pt.X < minXPix) minXPix = pt.X;
                if (pt.X > maxXPix) maxXPix = pt.X;
            }

            // Draw optical axis
            using (Pen axisPen = new Pen(Color.Gray, 1) { DashStyle = DashStyle.Dash })
            {
                g.DrawLine(axisPen, offsetX, offsetY, offsetX + drawingWidth, offsetY);
            }

            // Draw lens surfaces
            using (Pen lensPen = new Pen(Color.Black, 3))
            {
                DrawLens(g, lens, 0, lens.Front.Thickness, scaleX, offsetX, offsetY, lensPen, true);
            }

            // Draw dimensions
            DrawIndividualDimensions(g, lens, rect, scaleX, offsetX, offsetY, lensNumber, isReversed,
                frontUpper, frontLower, backUpper, backLower, edgeThickness, lensWidthMM, minXPix, maxXPix);
        }

        private void DrawIndividualDimensions(Graphics g, Lens lens, Rectangle rect, double scale, float offsetX,
     float offsetY, int lensNumber, bool isReversed, List<PointF> frontUpper, List<PointF> frontLower,
     List<PointF> backUpper, List<PointF> backLower, double edgeThickness, double lensWidthMM,
     float minXPix, float maxXPix)
        {
            Font dimFont = new Font("Segoe UI Semibold", 8);
            Brush dimBrush = Brushes.Black;
            Pen dimPen = new Pen(Color.Black, 1);
            float textPadding = 5;
            float shelfSpacing = 30; // Spacing between shelves
            float shelfLength = 50;  // Length of dimension shelf line
            float horizontalOffset = 60; // Space to the left of the lens for text
            float minShelfX = minXPix - horizontalOffset; // Starting X for shelves

            // Lens boundaries
            float xFront = frontUpper.First().X;
            float xBack = backUpper.First().X;
            float maxLensY = frontLower.Concat(backLower).Max(p => p.Y);
            float baseDimY = maxLensY + 20; // Starting Y position for dimensions

            // Define dimensions with start and end X positions
            List<(string Label, double Value, float StartX, float EndX)> dimensions = new List<(string, double, float, float)>
    {
        ($"Толщина по оси = {lens.Front.Thickness:0.000} мм", lens.Front.Thickness, xFront, xBack), // Center thickness
        ($"Толщина края = {edgeThickness:0.000} мм", edgeThickness, frontLower.Last().X, backLower.Last().X) // Edge thickness
    };

            // Add width for meniscus lenses
            bool isMeniscus = (lens.Front.Radius > 0 && lens.Back.Radius > 0) || (lens.Front.Radius < 0 && lens.Back.Radius < 0);
            if (isMeniscus)
            {
                dimensions.Add(($"Полнота = {lensWidthMM:0.000} мм", lensWidthMM, minXPix, maxXPix));
            }

            // Draw horizontal dimensions on shelves to the left
            for (int i = 0; i < dimensions.Count; i++)
            {
                string label = dimensions[i].Label;
                float startX = dimensions[i].StartX;
                float endX = dimensions[i].EndX;
                float dimY = baseDimY + i * shelfSpacing;

                // Extension lines
                if (i == 0) // Center thickness from axis
                {
                    g.DrawLine(dimPen, startX, offsetY, startX, dimY);
                    g.DrawLine(dimPen, endX, offsetY, endX, dimY);
                }
                else if (i == 1) // Edge thickness from lens edge
                {
                    float frontEdgeY = frontLower.Last().Y;
                    float backEdgeY = backLower.Last().Y;
                    g.DrawLine(dimPen, startX, frontEdgeY, startX, dimY);
                    g.DrawLine(dimPen, endX, backEdgeY, endX, dimY);
                }
                else // Width (if applicable)
                {
                    g.DrawLine(dimPen, startX, offsetY, startX, dimY);
                    g.DrawLine(dimPen, endX, offsetY, endX, dimY);
                }

                // Dimension line with arrows
                PointF dimStart = new PointF(startX, dimY);
                PointF dimEnd = new PointF(endX, dimY);
                DrawArrowLine(g, dimStart, dimEnd, 5, 1);

                // Draw shelf line extending left from the leftmost extension line
                float shelfXEnd = Math.Min(startX, endX) - shelfLength;
                g.DrawLine(dimPen, Math.Min(startX, endX), dimY, shelfXEnd, dimY);

                // Place text to the left of the shelf with padding
                SizeF labelSize = g.MeasureString(label, dimFont);
                float textX = shelfXEnd - labelSize.Width - textPadding;
                float textY = dimY - labelSize.Height / 2;
                g.DrawString(label, dimFont, dimBrush, textX, textY);
            }

            // Diameter dimensions (vertical, on sides) - unchanged
            PointF frontTop = frontUpper.Last();
            PointF frontBottom = frontLower.Last();
            float frontDimX = xFront - 50;
            g.DrawLine(dimPen, frontDimX, frontTop.Y, xFront, frontTop.Y);
            g.DrawLine(dimPen, frontDimX, frontBottom.Y, xFront, frontBottom.Y);
            DrawArrowLine(g, new PointF(frontDimX, frontTop.Y), new PointF(frontDimX, frontBottom.Y), 5, 1);
            string frontDiameterLabel = $"Ø {lens.Front.Diameter:0.000} мм";
            SizeF frontDiameterSize = g.MeasureString(frontDiameterLabel, dimFont);
            g.DrawString(frontDiameterLabel, dimFont, dimBrush, frontDimX - frontDiameterSize.Width - 5,
                (frontTop.Y + frontBottom.Y - frontDiameterSize.Height) / 2);

            PointF backTop = backUpper.Last();
            PointF backBottom = backLower.Last();
            float backDimX = xBack + 50;
            g.DrawLine(dimPen, backDimX, backTop.Y, xBack, backTop.Y);
            g.DrawLine(dimPen, backDimX, backBottom.Y, xBack, backBottom.Y);
            DrawArrowLine(g, new PointF(backDimX, backTop.Y), new PointF(backDimX, backBottom.Y), 5, 1);
            string backDiameterLabel = $"Ø {lens.Back.Diameter:0.000} мм";
            SizeF backDiameterSize = g.MeasureString(backDiameterLabel, dimFont);
            g.DrawString(backDiameterLabel, dimFont, dimBrush, backDimX + 5,
                (backTop.Y + backBottom.Y - backDiameterSize.Height) / 2);

            // Radius labels with leader lines - unchanged
            PointF arcPointFront = frontUpper[frontUpper.Count / 2];
            float frontRadiusX = xFront - 60;
            string frontRadiusLabel = $"R A = {lens.Front.Radius:0.000} мм";
            SizeF frontRadiusSize = g.MeasureString(frontRadiusLabel, dimFont);
            float frontRadiusY = arcPointFront.Y - frontRadiusSize.Height / 2;
            g.DrawString(frontRadiusLabel, dimFont, dimBrush, frontRadiusX - frontRadiusSize.Width, frontRadiusY);
            DrawLeaderLine(g, new PointF(frontRadiusX, arcPointFront.Y), arcPointFront, 5, 1);

            PointF arcPointBack = backUpper[backUpper.Count / 2];
            float backRadiusX = xBack + 60;
            string backRadiusLabel = $"R Б = {lens.Back.Radius:0.000} мм";
            SizeF backRadiusSize = g.MeasureString(backRadiusLabel, dimFont);
            float backRadiusY = arcPointBack.Y - backRadiusSize.Height / 2;
            g.DrawString(backRadiusLabel, dimFont, dimBrush, backRadiusX, backRadiusY);
            DrawLeaderLine(g, new PointF(backRadiusX, arcPointBack.Y), arcPointBack, 5, 1);

            // Orientation label - unchanged
            string orientationLabel = isReversed ? $"Lens {lensNumber} Reversed" : $"Lens {lensNumber}";
            g.DrawString(orientationLabel, dimFont, dimBrush, rect.Left + 10, rect.Top + 10);
        }

        /// <summary>
        /// Draws a line with an arrow at the end only, for leader lines.
        /// </summary>
        private void DrawLeaderLine(Graphics g, PointF start, PointF end, float arrowSize, int penWidth)
        {
            using (Pen pen = new Pen(Color.Black, penWidth))
            {
                AdjustableArrowCap arrowCap = new AdjustableArrowCap(arrowSize, arrowSize);
                pen.CustomEndCap = arrowCap;
                g.DrawLine(pen, start, end);
            }
        }

        /// <summary>
        /// Draws an arrowed line between two points.
        /// </summary>
        private void DrawArrowLine(Graphics g, PointF pt1, PointF pt2, float arrowSize, int penWidth)
        {
            using (Pen pen = new Pen(Color.Black, penWidth))
            {
                AdjustableArrowCap arrowCap = new AdjustableArrowCap(arrowSize, arrowSize);
                pen.CustomStartCap = arrowCap;
                pen.CustomEndCap = arrowCap;
                g.DrawLine(pen, pt1, pt2);
            }
        }

        /// <summary>
        /// Computes a list of points for a surface arc (upper or lower half) using the sag equation.
        /// </summary>
        private List<PointF> GetSurfaceArcPoints(Surface s, double vertexX, double scale, double centerY, float offsetX,
            bool upper)
        {
            List<PointF> pts = new List<PointF>();
            int numPoints = 50;
            double semiDiam = s.SemiDiameter;

            double startY = 0;
            double endY = upper ? semiDiam : -semiDiam;
            for (int i = 0; i <= numPoints; i++)
            {
                double t = (double)i / numPoints;
                double y = startY + t * (endY - startY);
                double xOffset = 0;
                if (double.IsInfinity(s.Radius))
                {
                    xOffset = 0;
                }
                else
                {
                    double R = s.Radius;
                    double radicand = R * R - y * y;
                    if (radicand < 0)
                        continue;
                    if (R > 0)
                        xOffset = R - Math.Sqrt(radicand);
                    else
                        xOffset = R + Math.Sqrt(radicand);
                }

                float x = (float)((vertexX + xOffset) * scale + offsetX);
                float yp = (float)(centerY - y * scale);
                pts.Add(new PointF(x, yp));
            }

            return pts;
        }
    }

    
}