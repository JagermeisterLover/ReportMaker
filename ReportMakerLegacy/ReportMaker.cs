using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.IO;
using System.Windows.Forms;
using System.Drawing;
using System.Text;



namespace ReportMaker
{
    public partial class ReportMaker : Form
    {
        BindingList<Surface> surfaces; // Dictionary to hold glass catalog data (keyed by glass name, case-insensitive)

        private Dictionary<string, GlassData> glassCatalog = new Dictionary<string, GlassData>(StringComparer.OrdinalIgnoreCase);
        private string loadedZmxFileName;

        public ReportMaker()
        {
            InitializeComponent();
            SetupDataGridViewColumns();

            // Initialize an empty list so that the grid is usable even before loading a file.
            surfaces = new BindingList<Surface>();
            dataGridViewLDE.DataSource = surfaces;

            // Set full row selection to simplify deletion.
            dataGridViewLDE.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
            dataGridViewLDE.MultiSelect = true;

            // Attach event handlers.
            dataGridViewLDE.DataError += DataGridViewLDE_DataError;
            dataGridViewLDE.KeyDown += DataGridViewLDE_KeyDown;
            dataGridViewLDE.DataBindingComplete += DataGridViewLDE_DataBindingComplete;
            dataGridViewLDE.RowPrePaint += DataGridViewLDE_RowPrePaint;
            dataGridViewLDE.CellValidating += DataGridViewLDE_CellValidating;
            dataGridViewLDE.CellFormatting += DataGridViewLDE_CellFormatting;
            dataGridViewLDE.CellValueChanged += DataGridViewLDE_CellValueChanged;
            dataGridViewLDE.CurrentCellDirtyStateChanged += DataGridViewLDE_CurrentCellDirtyStateChanged;
            dataGridViewLDE.EditingControlShowing += dataGridViewLDE_EditingControlShowing;
            dataGridViewLDE.EditMode = DataGridViewEditMode.EditOnKeystrokeOrF2;
            dataGridViewLDE.KeyPress += dataGridViewLDE_KeyPress;

            dataGridViewLDE.CellBeginEdit += DataGridViewLDE_CellBeginEdit;
            dataGridViewLDE.CellEndEdit += DataGridViewLDE_CellEndEdit;

            dataGridViewLDE.CellParsing += DataGridViewLDE_CellParsing;

            // Hook up wavelength text changed event (ensure textboxWavelength exists on your form)
            textBoxWavelength.TextChanged += textBoxWavelength_TextChanged;

            glassCatalog = GlassCatalogLoader.LoadAllGlassCatalogs(Application.StartupPath);

            // Optionally update refractive indices if a valid wavelength is already provided.
            UpdateRefractiveIndices();
        }

        /// <summary>
        /// Sets up the DataGridView columns.
        /// </summary>
        private void SetupDataGridViewColumns()
        {
            // Existing columns...
            dataGridViewLDE.AutoGenerateColumns = false;
            dataGridViewLDE.Columns.Clear();

            // Column 0: Numbering ("№")
            DataGridViewTextBoxColumn colNumber = new DataGridViewTextBoxColumn
            {
                HeaderText = "№",
                Name = "colNumber",
                ReadOnly = true,
                Width = 30
            };
            dataGridViewLDE.Columns.Add(colNumber);

            // Column 1: Radius (editable)
            DataGridViewTextBoxColumn colRadius = new DataGridViewTextBoxColumn
            {
                DataPropertyName = "Radius",
                HeaderText = "Радиус",
                Width = 80
            };
            dataGridViewLDE.Columns.Add(colRadius);

            // Column 2: Thickness (air gap)
            DataGridViewTextBoxColumn colThickness = new DataGridViewTextBoxColumn
            {
                DataPropertyName = "Thickness",
                HeaderText = "Толщина",
                Width = 80
            };
            dataGridViewLDE.Columns.Add(colThickness);

            // Column 3: Material
            DataGridViewTextBoxColumn colMaterial = new DataGridViewTextBoxColumn
            {
                DataPropertyName = "Material",
                HeaderText = "Материал",
                Width = 70
            };
            dataGridViewLDE.Columns.Add(colMaterial);

            // Column 4: Refractive Index (n)
            DataGridViewTextBoxColumn colRefractiveIndex = new DataGridViewTextBoxColumn
            {
                DataPropertyName = "RefractiveIndex",
                HeaderText = "n",
                Width = 100
            };
            dataGridViewLDE.Columns.Add(colRefractiveIndex);

            // Column 5: Semi-Diameter
            DataGridViewTextBoxColumn colSemiDiam = new DataGridViewTextBoxColumn
            {
                DataPropertyName = "SemiDiameter",
                HeaderText = "Высота",
                Width = 80
            };
            dataGridViewLDE.Columns.Add(colSemiDiam);

            // Column 6: Diameter
            DataGridViewTextBoxColumn colDiam = new DataGridViewTextBoxColumn
            {
                DataPropertyName = "Diameter",
                HeaderText = "Диаметр",
                Width = 80
            };
            dataGridViewLDE.Columns.Add(colDiam);

            // New Column 7: Mechanical Height
            DataGridViewTextBoxColumn colMechHeight = new DataGridViewTextBoxColumn
            {
                DataPropertyName = "MechHeight",
                HeaderText = "Мех. Высота",
                Width = 80
            };
            dataGridViewLDE.Columns.Add(colMechHeight);

            // New Column 8: Mechanical Diameter
            DataGridViewTextBoxColumn colMechDiam = new DataGridViewTextBoxColumn
            {
                DataPropertyName = "MechDiameter",
                HeaderText = "Мех. Диаметр",
                Width = 80
            };
            dataGridViewLDE.Columns.Add(colMechDiam);

            // Column 9: Base (checkbox)
            DataGridViewCheckBoxColumn colBase = new DataGridViewCheckBoxColumn
            {
                DataPropertyName = "Base",
                HeaderText = "База",
                Width = 60
            };
            dataGridViewLDE.Columns.Add(colBase);

            // Column 10: Decenter (mm)
            DataGridViewTextBoxColumn colDecenterMm = new DataGridViewTextBoxColumn
            {
                DataPropertyName = "DecenterMm",
                HeaderText = "Decenter (mm)",
                Name = "DecenterMm",
                Width = 80
            };
            dataGridViewLDE.Columns.Add(colDecenterMm);

            // Columns 11-13: Decenter angle in DMS
            DataGridViewTextBoxColumn colDecenterDeg = new DataGridViewTextBoxColumn
            {
                DataPropertyName = "DecenterDeg",
                HeaderText = "Гр",
                Name = "DecenterDeg",
                Width = 60
            };
            dataGridViewLDE.Columns.Add(colDecenterDeg);

            DataGridViewTextBoxColumn colDecenterMin = new DataGridViewTextBoxColumn
            {
                DataPropertyName = "DecenterMin",
                HeaderText = "Мин",
                Name = "DecenterMin",
                Width = 60
            };
            dataGridViewLDE.Columns.Add(colDecenterMin);

            DataGridViewTextBoxColumn colDecenterSec = new DataGridViewTextBoxColumn
            {
                DataPropertyName = "DecenterSec",
                HeaderText = "Сек",
                Name = "DecenterSec",
                Width = 60
            };
            dataGridViewLDE.Columns.Add(colDecenterSec);


            // Column: φ (arc angle in degrees)
            DataGridViewTextBoxColumn colPhi = new DataGridViewTextBoxColumn
            {
                HeaderText = "φ, градусы",
                Name = "colPhi",
                ReadOnly = true,
                Width = 70
            };
            dataGridViewLDE.Columns.Add(colPhi);

        }


        private void DataGridViewLDE_CellEndEdit(object sender, DataGridViewCellEventArgs e)
        {
            if (dataGridViewLDE.Columns[e.ColumnIndex].DataPropertyName == "Radius")
            {
                if (dataGridViewLDE.Rows[e.RowIndex].DataBoundItem is Surface s)
                {
                    // Re-enable recalculation after editing.
                    s.SuppressRecalc = false;
                    // Manually update the decenter based on the final radius value.
                    if (s.Radius != double.PositiveInfinity && s.Radius != 0)
                        s.DecenterMm = Math.Tan(s.DecenterDMS * Math.PI / 180.0) * s.Radius;
                    else s.DecenterMm = 0;
                }
            }
        }

        private void DataGridViewLDE_CellBeginEdit(object sender, DataGridViewCellCancelEventArgs e)
        {
            if (dataGridViewLDE.Columns[e.ColumnIndex].DataPropertyName == "Radius")
            {
                if (dataGridViewLDE.Rows[e.RowIndex].DataBoundItem is Surface s)
                {
                    // Suppress decenter recalculation while the user is editing.
                    s.SuppressRecalc = true;
                }
            }
        }


        /// <summary>
        /// Opens a .zmx file and parses its content.
        /// </summary>
        private void btnOpen_Click(object sender, EventArgs e)
        {
            using (OpenFileDialog ofd = new OpenFileDialog())
            {
                ofd.Filter = "Zemax files (*.zmx)|*.zmx";
                if (ofd.ShowDialog() == DialogResult.OK)
                {
                    try
                    {
                        loadedZmxFileName = Path.GetFileName(ofd.FileName); // Store file name
                        string[] lines = File.ReadAllLines(ofd.FileName);
                        List<Surface> parsedSurfaces = ZmxParser.Parse(lines);
                        surfaces = new BindingList<Surface>(parsedSurfaces);
                        dataGridViewLDE.DataSource = surfaces;
                        ProcessLensBases();
                        UpdateRefractiveIndices();
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("Error reading file: " + ex.Message);
                    }
                }
            }
        }


        /// <summary>
        /// Processes lens pairs (first surface has Material, second doesn't) and sets the Base checkbox automatically.
        /// Also sets decenter values to 0 for the chosen surface.
        /// </summary>
        private void ProcessLensBases()
        {
            for (int i = 0; i < surfaces.Count - 1; i++)
            {
                if (!string.IsNullOrEmpty(surfaces[i].Material) && string.IsNullOrEmpty(surfaces[i + 1].Material))
                {
                    double R1 = surfaces[i].Radius;
                    double R2 = surfaces[i + 1].Radius;
                    if (R1 > 0 && R2 < 0)
                    {
                        if (Math.Abs(R1) > Math.Abs(R2))
                        {
                            surfaces[i].Base = true;
                            surfaces[i + 1].Base = false;
                            surfaces[i].DecenterMm = 0;
                        }
                        else
                        {
                            surfaces[i + 1].Base = true;
                            surfaces[i].Base = false;
                            surfaces[i + 1].DecenterMm = 0;
                        }
                    }
                    else if (R1 < 0 && R2 > 0)
                    {
                        surfaces[i + 1].Base = true;
                        surfaces[i].Base = false;
                        surfaces[i + 1].DecenterMm = 0;
                    }
                    else if (R1 < 0 && R2 < 0)
                    {
                        if (Math.Abs(R1) > Math.Abs(R2))
                        {
                            surfaces[i].Base = true;
                            surfaces[i + 1].Base = false;
                            surfaces[i].DecenterMm = 0;
                        }
                        else
                        {
                            surfaces[i + 1].Base = true;
                            surfaces[i].Base = false;
                            surfaces[i + 1].DecenterMm = 0;
                        }
                    }
                    else if (R1 > 0 && R2 > 0)
                    {
                        surfaces[i].Base = true;
                        surfaces[i + 1].Base = false;
                        surfaces[i].DecenterMm = 0;
                    }
                }
            }

            for (int i = 0; i < dataGridViewLDE.Rows.Count; i++)
            {
                UpdateDecenterCellStateForRow(i);
            }
        }

        /// <summary>
        /// Updates the decenter columns for a given row.
        /// </summary>
        private void UpdateDecenterCellStateForRow(int rowIndex)
        {
            DataGridViewRow row = dataGridViewLDE.Rows[rowIndex];
            if (row.DataBoundItem is Surface s)
            {
                bool isBase = s.Base;
                DataGridViewCell cellDecenterMm = row.Cells["DecenterMm"];
                DataGridViewCell cellDecenterDeg = row.Cells["DecenterDeg"];
                DataGridViewCell cellDecenterMin = row.Cells["DecenterMin"];
                DataGridViewCell cellDecenterSec = row.Cells["DecenterSec"];
                if (isBase)
                {
                    cellDecenterMm.ReadOnly = true;
                    cellDecenterDeg.ReadOnly = true;
                    cellDecenterMin.ReadOnly = true;
                    cellDecenterSec.ReadOnly = true;
                    cellDecenterMm.Style.BackColor = Color.LightGray;
                    cellDecenterDeg.Style.BackColor = Color.LightGray;
                    cellDecenterMin.Style.BackColor = Color.LightGray;
                    cellDecenterSec.Style.BackColor = Color.LightGray;
                    cellDecenterMm.Value = 0;
                    cellDecenterDeg.Value = 0;
                    cellDecenterMin.Value = 0;
                    cellDecenterSec.Value = 0;
                }
                else
                {
                    cellDecenterMm.ReadOnly = false;
                    cellDecenterDeg.ReadOnly = false;
                    cellDecenterMin.ReadOnly = false;
                    cellDecenterSec.ReadOnly = false;
                    cellDecenterMm.Style.BackColor = Color.White;
                    cellDecenterDeg.Style.BackColor = Color.White;
                    cellDecenterMin.Style.BackColor = Color.White;
                    cellDecenterSec.Style.BackColor = Color.White;
                }
            }
        }

        private void DataGridViewLDE_CurrentCellDirtyStateChanged(object sender, EventArgs e)
        {
            if (dataGridViewLDE.IsCurrentCellDirty)
            {
                dataGridViewLDE.CommitEdit(DataGridViewDataErrorContexts.Commit);
            }
        }


        private void DataGridViewLDE_CellParsing(object sender, DataGridViewCellParsingEventArgs e)
        {
            if (dataGridViewLDE.Columns[e.ColumnIndex].DataPropertyName == "Radius")
            {
                string input = e.Value?.ToString().Trim().ToLower();
                if (string.IsNullOrEmpty(input) || input == "0" || input == "inf" || input == "infinity" || input == "∞")
                {
                    e.Value = double.PositiveInfinity;
                    e.ParsingApplied = true;
                }
                else
                {
                    if (double.TryParse(input, NumberStyles.Float, CultureInfo.CurrentCulture, out double parsedValue))
                    {
                        e.Value = parsedValue;
                        e.ParsingApplied = true;
                    }
                    else
                    {
                        e.ParsingApplied = false; // Let the grid show an error if parsing fails
                    }
                }
            }
        }

        private void DataGridViewLDE_CellValueChanged(object sender, DataGridViewCellEventArgs e)
        {
            if (dataGridViewLDE.Columns[e.ColumnIndex].DataPropertyName == "Base")
            {
                DataGridViewRow row = dataGridViewLDE.Rows[e.RowIndex];
                if (row.DataBoundItem is Surface s)
                {
                    UpdateDecenterCellStateForRow(e.RowIndex);
                    int i = e.RowIndex;
                    if (i > 0)
                    {
                        DataGridViewRow prevRow = dataGridViewLDE.Rows[i - 1];
                        if (prevRow.DataBoundItem is Surface sPrev)
                        {
                            if (!string.IsNullOrEmpty(sPrev.Material) && string.IsNullOrEmpty(s.Material))
                            {
                                if (s.Base)
                                {
                                    sPrev.Base = false;
                                    UpdateDecenterCellStateForRow(i - 1);
                                }
                            }
                        }
                    }

                    if (i < dataGridViewLDE.Rows.Count - 1)
                    {
                        DataGridViewRow nextRow = dataGridViewLDE.Rows[i + 1];
                        if (nextRow.DataBoundItem is Surface sNext)
                        {
                            if (!string.IsNullOrEmpty(s.Material) && string.IsNullOrEmpty(sNext.Material))
                            {
                                if (s.Base)
                                {
                                    sNext.Base = false;
                                    UpdateDecenterCellStateForRow(i + 1);
                                }
                            }
                        }
                    }
                }
            }

            if (dataGridViewLDE.Columns[e.ColumnIndex].DataPropertyName == "Radius" ||
    dataGridViewLDE.Columns[e.ColumnIndex].DataPropertyName == "MechDiameter")
            {
                dataGridViewLDE.Refresh(); // Trigger DataBindingComplete again
            }
        }

        private void DataGridViewLDE_DataError(object sender, DataGridViewDataErrorEventArgs e)
        {
            e.ThrowException = false;
        }




        private void DataGridViewLDE_KeyDown(object sender, KeyEventArgs e)
        {
            // Check if the key is a digit and we're not already editing.
            if (!dataGridViewLDE.IsCurrentCellInEditMode && ((e.KeyCode >= Keys.D0 && e.KeyCode <= Keys.D9) ||
                                                             (e.KeyCode >= Keys.NumPad0 && e.KeyCode <= Keys.NumPad9)))
            {
                dataGridViewLDE.BeginEdit(true);
                if (dataGridViewLDE.EditingControl is TextBox tb)
                {
                    string digit = "";
                    if (e.KeyCode >= Keys.D0 && e.KeyCode <= Keys.D9)
                    {
                        digit = (e.KeyCode - Keys.D0).ToString();
                    }
                    else if (e.KeyCode >= Keys.NumPad0 && e.KeyCode <= Keys.NumPad9)
                    {
                        digit = (e.KeyCode - Keys.NumPad0).ToString();
                    }

                    tb.Text = digit;
                    tb.SelectionStart = tb.Text.Length;
                }

                e.Handled = true;
                return;
            }

            if (e.KeyCode == Keys.Insert)
            {
                if (dataGridViewLDE.IsCurrentCellInEditMode) dataGridViewLDE.EndEdit();
                this.BeginInvoke((MethodInvoker)delegate
                {
                    if (surfaces != null)
                    {
                        int insertIndex = 0;
                        if (dataGridViewLDE.CurrentRow != null)
                        {
                            if (dataGridViewLDE.CurrentRow.IsNewRow)
                            {
                                insertIndex = (surfaces.Count > 0) ? surfaces.Count - 1 : 0;
                            }
                            else
                            {
                                int currentIndex = dataGridViewLDE.CurrentRow.Index;
                                if (currentIndex == surfaces.Count - 1)
                                    insertIndex = currentIndex;
                                else
                                    insertIndex = currentIndex + 1;
                            }
                        }
                        else
                        {
                            insertIndex = surfaces.Count;
                        }

                        surfaces.Insert(insertIndex, new Surface());
                    }
                });
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.Delete)
            {
                List<Surface> toRemove = new List<Surface>();
                if (dataGridViewLDE.SelectedRows.Count > 0)
                {
                    foreach (DataGridViewRow row in dataGridViewLDE.SelectedRows)
                    {
                        if (row.DataBoundItem is Surface surface)
                            toRemove.Add(surface);
                    }
                }
                else if (dataGridViewLDE.CurrentRow != null &&
                         dataGridViewLDE.CurrentRow.DataBoundItem is Surface currentSurface)
                {
                    toRemove.Add(currentSurface);
                }

                foreach (var surface in toRemove)
                {
                    surfaces.Remove(surface);
                }

                e.Handled = true;
            }
        }






        private void dataGridViewLDE_KeyPress(object sender, KeyPressEventArgs e)
        { // If not already editing and the key isn't a control character (like backspace)
            if (!dataGridViewLDE.IsCurrentCellInEditMode && !char.IsControl(e.KeyChar))
            {
                // Force the grid into edit mode
                dataGridViewLDE.BeginEdit(true);
                if (dataGridViewLDE.EditingControl is TextBox tb)
                {
                    // Insert the pressed key into the text box and place the caret at the end
                    tb.Text = e.KeyChar.ToString();
                    tb.SelectionStart = tb.Text.Length;
                }

                e.Handled = true;
            }
        }

        private void DataGridViewLDE_DataBindingComplete(object sender, DataGridViewBindingCompleteEventArgs e)
        {
            foreach (DataGridViewRow row in dataGridViewLDE.Rows)
            {
                row.Cells["colNumber"].Value = (row.Index + 1).ToString();

                if (row.DataBoundItem is Surface s)
                {
                    double R = s.Radius;
                    double D = s.MechDiameter;

                    if (R != 0 && !double.IsPositiveInfinity(R) && !double.IsNaN(D))
                    {
                        double value = D / (2 * Math.Abs(R));
                        if (value <= 1) // arcsin domain check
                        {
                            double phiRadians = Math.Asin(value);
                            double phiDegrees = phiRadians * (180.0 / Math.PI);
                            row.Cells["colPhi"].Value = phiDegrees.ToString("F4");
                        }
                        else
                        {
                            row.Cells["colPhi"].Value = "0";
                        }
                    }
                    else
                    {
                        row.Cells["colPhi"].Value = "0";
                    }
                }
            }
        }

        private void DataGridViewLDE_RowPrePaint(object sender, DataGridViewRowPrePaintEventArgs e)
        {
            var grid = sender as DataGridView;
            var row = grid.Rows[e.RowIndex];
            if (row.DataBoundItem is Surface surface)
            {
                row.DefaultCellStyle.BackColor =
                    !string.IsNullOrEmpty(surface.Material) ? Color.LightBlue : grid.DefaultCellStyle.BackColor;
            }
        }

        private void DataGridViewLDE_CellValidating(object sender, DataGridViewCellValidatingEventArgs e)
        {
            string colName = dataGridViewLDE.Columns[e.ColumnIndex].DataPropertyName;
            string cellValue = e.FormattedValue?.ToString().Trim();
            if (!string.IsNullOrWhiteSpace(cellValue) &&
                (colName != "DecenterDeg" && colName != "DecenterMin" && colName != "DecenterSec") &&
                cellValue.Contains("."))
            {
                cellValue = cellValue.Replace(".", ",");
                if (dataGridViewLDE.EditingControl is TextBox tb)
                    tb.Text = cellValue;
            }
            if (colName == "Radius" || colName == "Thickness" || colName == "SemiDiameter" ||
                colName == "Diameter" || colName == "DecenterMm" || colName == "MechHeight" || colName == "MechDiameter")
            {
                double result = 0;
                if (colName == "Radius")
                {
                    if (string.IsNullOrWhiteSpace(cellValue))
                    {
                        result = double.PositiveInfinity;
                    }
                    else if (string.Equals(cellValue, "0", StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(cellValue, "0,0", StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(cellValue, "inf", StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(cellValue, "infinity", StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(cellValue, "∞", StringComparison.OrdinalIgnoreCase))
                    {
                        result = double.PositiveInfinity;
                    }
                    else if (!double.TryParse(cellValue, NumberStyles.Float, CultureInfo.CurrentCulture, out result))
                    {
                        MessageBox.Show("Please enter a valid numeric value for Radius.");
                        e.Cancel = true;
                        return;
                    }
                    if (result == 0)
                        result = double.PositiveInfinity;
                }
                else
                {
                    if (string.IsNullOrWhiteSpace(cellValue))
                        return;
                    if (!double.TryParse(cellValue, NumberStyles.Float, CultureInfo.CurrentCulture, out result))
                    {
                        MessageBox.Show("Please enter a valid numeric value.");
                        e.Cancel = true;
                        return;
                    }
                }
            }
            else if (colName == "DecenterDeg" || colName == "DecenterMin")
            {
                if (string.IsNullOrWhiteSpace(cellValue))
                    return;
                if (!int.TryParse(cellValue, out int iVal))
                {
                    MessageBox.Show("Please enter a valid integer value for " + colName + ".");
                    e.Cancel = true;
                    return;
                }
            }
            else if (colName == "DecenterSec")
            {
                if (string.IsNullOrWhiteSpace(cellValue))
                    return;
                if (!double.TryParse(cellValue, NumberStyles.Float, CultureInfo.CurrentCulture, out double dVal))
                {
                    MessageBox.Show("Please enter a valid numeric value for Decenter (sec).");
                    e.Cancel = true;
                    return;
                }
            }
        }

        private void DataGridViewLDE_CellFormatting(object sender, DataGridViewCellFormattingEventArgs e)
        {
            string colName = dataGridViewLDE.Columns[e.ColumnIndex].DataPropertyName;
            if (colName == "Radius" && e.Value is double d && double.IsPositiveInfinity(d))
            {
                e.Value = "Infinity";
                e.FormattingApplied = true;
            }
        }

        private void dataGridViewLDE_EditingControlShowing(object sender, DataGridViewEditingControlShowingEventArgs e)
        {
            if (e.Control is TextBox tb)
            {
                // Ensure caret is at the end and nothing is selected.
                tb.SelectionStart = tb.Text.Length;
                tb.SelectionLength = 0;


            }
        }




        /// <summary>
        /// Event handler for textboxWavelength changes.
        /// When the user enters a new wavelength (in micrometers), update the refractive indices.
        /// </summary>
        private void textBoxWavelength_TextChanged(object sender, EventArgs e)
        {
            UpdateRefractiveIndices();
            CultureInfo commaCulture = CultureInfo.GetCultureInfo("ru-RU");
            if (!string.IsNullOrEmpty(textBoxWavelength.Text) &&
                !double.TryParse(textBoxWavelength.Text, NumberStyles.Float, commaCulture, out _))
            {
                textBoxWavelength.BackColor = Color.LightPink; // Highlight invalid input
            }
            else
            {
                textBoxWavelength.BackColor = SystemColors.Window; // Reset to normal
            }
        }

        /// <summary>
        /// Updates the RefractiveIndex property of each Surface by looking up the glass catalog
        /// and using the appropriate dispersion formula with the wavelength from textboxWavelength.
        /// </summary>
        private void UpdateRefractiveIndices()
        {
            // Use a culture that accepts commas as decimal separators, e.g., Russian
            CultureInfo commaCulture = CultureInfo.GetCultureInfo("ru-RU"); // Comma as decimal separator

            if (!double.TryParse(textBoxWavelength.Text, NumberStyles.Float, commaCulture, out double wavelength))
            {
                return; // Exit if parsing fails; refractive indices won't update
            }
            // Ensure wavelength is positive
            if (wavelength <= 0)
                return;

            double lambda2 = wavelength * wavelength;
            foreach (Surface s in surfaces)
            {
                if (!string.IsNullOrEmpty(s.Material) && glassCatalog.TryGetValue(s.Material, out GlassData gd))
                {
                    double nSquared = 0;
                    if (gd.DispersionFormulaType == 2)
                    {
                        double term1 = (gd.K1 * lambda2) / (lambda2 - gd.L1);
                        double term2 = (gd.K2 * lambda2) / (lambda2 - gd.L2);
                        double term3 = (gd.K3 * lambda2) / (lambda2 - gd.L3);
                        nSquared = 1 + term1 + term2 + term3;
                    }
                    else if (gd.DispersionFormulaType == 12)
                    {
                        double L2 = wavelength * wavelength;
                        double L4 = L2 * L2;
                        double L6 = L4 * L2;
                        double L8 = L4 * L4;
                        double invL2 = 1.0 / L2;
                        double invL4 = 1.0 / L4;
                        double invL6 = 1.0 / L6;
                        double invL8 = 1.0 / L8;
                        nSquared = gd.A0 + gd.A1 * L2 + gd.A2 * invL2 + gd.A3 * invL4 + gd.A4 * invL6 + gd.A5 * invL8 + gd.A6 * L4 + gd.A7 * L6;
                    }
                    s.RefractiveIndex = (nSquared < 0) ? 0 : Math.Sqrt(nSquared);
                }
                else
                {
                    // For surfaces with no material, assume air (n=1)
                    s.RefractiveIndex = 1;
                }
            }
            dataGridViewLDE.Refresh();
        }



        private void WriteOpticalSystemToFile()
        {
            List<int> materialSurfaces = new List<int>();
            for (int i = 0; i < surfaces.Count; i++)
            {
                if (!string.IsNullOrEmpty(surfaces[i].Material))
                    materialSurfaces.Add(i);
            }

            List<List<int>> lenses = new List<List<int>>();
            foreach (int i in materialSurfaces)
                if (i + 1 < surfaces.Count)
                    lenses.Add(new List<int> { i, i + 1 });

            if (lenses.Count == 0) return;

            int firstSurface = lenses.Min(l => l[0]);
            int lastSurface = lenses.Max(l => l[1]);

            using (var writer = new StreamWriter("sys.txt"))
            {
                writer.WriteLine("Optical system");
                writer.WriteLine("Surface\tR\tt\tn\tD\tMD\tφ");

                // Full system
                for (int k = firstSurface; k <= lastSurface; k++)
                {
                    var s = surfaces[k];
                    int surfaceNum = k - firstSurface + 1;

                    double R = s.Radius;
                    double D = s.MechDiameter;

                    // compute φ
                    double phiDeg = 0;
                    if (R != 0 && !double.IsPositiveInfinity(R) && !double.IsNaN(D))
                    {
                        double v = D / (2 * Math.Abs(R));
                        if (v <= 1)
                            phiDeg = Math.Asin(v) * (180.0 / Math.PI);
                    }

                    string rStr = double.IsPositiveInfinity(R) ? "Infinity" : R.ToString("F6", CultureInfo.InvariantCulture);
                    string tStr = (k < lastSurface)
                        ? (double.IsPositiveInfinity(s.Thickness) ? "Infinity" : s.Thickness.ToString("F6", CultureInfo.InvariantCulture))
                        : "0";
                    string nStr = s.RefractiveIndex.ToString("F9", CultureInfo.InvariantCulture);
                    string dStr = s.Diameter.ToString("F6", CultureInfo.InvariantCulture);
                    string mdStr = D.ToString("F6", CultureInfo.InvariantCulture);
                    string phiStr = phiDeg.ToString("F4", CultureInfo.InvariantCulture);

                    writer.WriteLine("{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}",
                        surfaceNum, rStr, tStr, nStr, dStr, mdStr, phiStr);
                }

                writer.WriteLine();
                writer.WriteLine();

                // Individual lenses
                for (int lensNum = 0; lensNum < lenses.Count; lensNum++)
                {
                    var lens = lenses[lensNum];
                    writer.WriteLine("Lens {0}", lensNum + 1);
                    writer.WriteLine("Surface\tR\tt\tn\tD\tMD\tφ");

                    for (int j = 0; j < lens.Count; j++)
                    {
                        int idx = lens[j];
                        var s = surfaces[idx];
                        double R = s.Radius;
                        double D = s.MechDiameter;

                        // φ for individual lens surfaces
                        double phiDeg = 0;
                        if (R != 0 && !double.IsPositiveInfinity(R) && !double.IsNaN(D))
                        {
                            double v = D / (2 * Math.Abs(R));
                            if (v <= 1)
                                phiDeg = Math.Asin(v) * (180.0 / Math.PI);
                        }

                        string rStr = double.IsPositiveInfinity(R) ? "Infinity" : R.ToString("F6", CultureInfo.InvariantCulture);
                        string tStr = (j < lens.Count - 1)
                            ? (double.IsPositiveInfinity(s.Thickness) ? "Infinity" : s.Thickness.ToString("F6", CultureInfo.InvariantCulture))
                            : "0";
                        string nStr = (j < lens.Count - 1)
                            ? s.RefractiveIndex.ToString("F9", CultureInfo.InvariantCulture)
                            : "1.000000000";
                        string dStr = s.Diameter.ToString("F6", CultureInfo.InvariantCulture);
                        string mdStr = D.ToString("F6", CultureInfo.InvariantCulture);
                        string phiStr = phiDeg.ToString("F4", CultureInfo.InvariantCulture);

                        writer.WriteLine("{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}",
                            j + 1, rStr, tStr, nStr, dStr, mdStr, phiStr);
                    }
                    writer.WriteLine();
                }
            }
        }

        private void WriteReversedOpticalSystemToFile()
        {
            List<int> materialSurfaces = new List<int>();
            for (int i = 0; i < surfaces.Count; i++)
                if (!string.IsNullOrEmpty(surfaces[i].Material))
                    materialSurfaces.Add(i);

            List<List<int>> lenses = new List<List<int>>();
            foreach (int i in materialSurfaces)
                if (i + 1 < surfaces.Count)
                    lenses.Add(new List<int> { i, i + 1 });

            if (lenses.Count == 0) return;

            int firstSurface = lenses.Min(l => l[0]);
            int lastSurface = lenses.Max(l => l[1]);
            int n = lastSurface - firstSurface + 1;

            using (var writer = new StreamWriter("sysR.txt"))
            {
                writer.WriteLine("Optical system reversed");
                writer.WriteLine("Surface\tR\tt\tn\tD\tMD\tφ");

                // Full reversed system
                for (int k = 1; k <= n; k++)
                {
                    int origIdx = lastSurface - k + 1;
                    var s = surfaces[origIdx];
                    double R_rev = -s.Radius;
                    double D = s.MechDiameter;

                    // φ computation with reversed radius
                    double phiDeg = 0;
                    if (R_rev != 0 && !double.IsPositiveInfinity(R_rev) && !double.IsNaN(D))
                    {
                        double v = D / (2 * Math.Abs(R_rev));
                        if (v <= 1)
                            phiDeg = Math.Asin(v) * (180.0 / Math.PI);
                    }

                    string rStr = double.IsPositiveInfinity(R_rev) ? "Infinity" : R_rev.ToString("F6", CultureInfo.InvariantCulture);
                    string tStr = (k < n)
                        ? surfaces[lastSurface - k].Thickness.ToString("F6", CultureInfo.InvariantCulture)
                        : "0";
                    string nStr = (k < n)
                        ? surfaces[lastSurface - k].RefractiveIndex.ToString("F9", CultureInfo.InvariantCulture)
                        : "1.000000000";
                    string dStr = s.Diameter.ToString("F6", CultureInfo.InvariantCulture);
                    string mdStr = D.ToString("F6", CultureInfo.InvariantCulture);
                    string phiStr = phiDeg.ToString("F4", CultureInfo.InvariantCulture);

                    writer.WriteLine("{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}",
                        k, rStr, tStr, nStr, dStr, mdStr, phiStr);
                }

                writer.WriteLine();
                writer.WriteLine();

                // Individual reversed lenses
                for (int lensNum = 0; lensNum < lenses.Count; lensNum++)
                {
                    var lens = lenses[lensNum];
                    int i = lens[0], j = lens[1];
                    var s_i = surfaces[i];
                    var s_j = surfaces[j];

                    writer.WriteLine("Lens {0} reversed", lensNum + 1);
                    writer.WriteLine("Surface\tR\tt\tn\tD\tMD\tφ");

                    // First reversed surface
                    double R1_rev = -s_j.Radius;
                    double D1 = s_j.MechDiameter;
                    double phi1 = 0;
                    if (R1_rev != 0 && !double.IsPositiveInfinity(R1_rev) && !double.IsNaN(D1))
                    {
                        double v = D1 / (2 * Math.Abs(R1_rev));
                        if (v <= 1) phi1 = Math.Asin(v) * (180.0 / Math.PI);
                    }
                    string r1Str = double.IsPositiveInfinity(R1_rev) ? "Infinity" : R1_rev.ToString("F6", CultureInfo.InvariantCulture);
                    string t1Str = s_i.Thickness.ToString("F6", CultureInfo.InvariantCulture);
                    string n1Str = s_i.RefractiveIndex.ToString("F9", CultureInfo.InvariantCulture);
                    string d1Str = s_j.Diameter.ToString("F6", CultureInfo.InvariantCulture);
                    string md1Str = D1.ToString("F6", CultureInfo.InvariantCulture);
                    string phi1Str = phi1.ToString("F4", CultureInfo.InvariantCulture);

                    writer.WriteLine("1\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}",
                        r1Str, t1Str, n1Str, d1Str, md1Str, phi1Str);

                    // Second reversed surface
                    double R2_rev = -s_i.Radius;
                    double D2 = s_i.MechDiameter;
                    double phi2 = 0;
                    if (R2_rev != 0 && !double.IsPositiveInfinity(R2_rev) && !double.IsNaN(D2))
                    {
                        double v = D2 / (2 * Math.Abs(R2_rev));
                        if (v <= 1) phi2 = Math.Asin(v) * (180.0 / Math.PI);
                    }
                    string r2Str = double.IsPositiveInfinity(R2_rev) ? "Infinity" : R2_rev.ToString("F6", CultureInfo.InvariantCulture);
                    string t2Str = "0";
                    string n2Str = "1.000000000";
                    string d2Str = s_i.Diameter.ToString("F6", CultureInfo.InvariantCulture);
                    string md2Str = D2.ToString("F6", CultureInfo.InvariantCulture);
                    string phi2Str = phi2.ToString("F4", CultureInfo.InvariantCulture);

                    writer.WriteLine("2\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}",
                        r2Str, t2Str, n2Str, d2Str, md2Str, phi2Str);

                    writer.WriteLine();
                }
            }
        }







        // Then modify the buttonAutocollimation click handler:
        private void btnAutocollimation_Click(object sender, EventArgs e)
        {
            WriteOpticalSystemToFile();       // Existing method for sys.txt
            WriteReversedOpticalSystemToFile(); // New method for sysR.txt
            AutocollimationResultsForm resultsForm = new AutocollimationResultsForm();
            resultsForm.ShowDialog();
        }

        private void buttonDraw_Click(object sender, EventArgs e)
        {
            // Ensure the optical system files exist by writing them.
            WriteOpticalSystemToFile();
            WriteReversedOpticalSystemToFile();

            // Now safely parse the optical system data.
            List<Surface> regularSystem = ParseSurfacesFromFile("sys.txt");
            List<Surface> reversedSystem = ParseSurfacesFromFile("sysR.txt");

            // Also parse individual lenses from both files.
            List<Lens> regularLenses = ParseIndividualLensesFromFile("sys.txt");
            List<Lens> reversedLenses = ParseIndividualLensesFromFile("sysR.txt");

            LensDrawingForm drawingForm = new LensDrawingForm(regularSystem, reversedSystem, regularLenses, reversedLenses);
            drawingForm.Show();
        }

        private Surface ParseSurface(string line)
        {
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith("Surface"))
            {
                throw new FormatException("Invalid surface data line: header or empty line detected.");
            }

            string[] parts = line.Split('\t');
            if (parts.Length < 6) // Now expect 6 parts
            {
                throw new FormatException("Insufficient data in surface line; expected 6 columns.");
            }

            System.Globalization.CultureInfo invariantCulture = System.Globalization.CultureInfo.InvariantCulture;

            Surface surface = new Surface
            {
                Radius = double.Parse(parts[1], invariantCulture),
                Thickness = double.Parse(parts[2], invariantCulture),
                RefractiveIndex = double.Parse(parts[3], invariantCulture),
                Diameter = double.Parse(parts[4], invariantCulture),
                MechDiameter = double.Parse(parts[5], invariantCulture)
            };
            surface.SemiDiameter = surface.Diameter / 2; // Calculate SemiDiameter

            return surface;
        }

        private List<Lens> ParseIndividualLensesFromFile(string fileName)
        {
            string[] lines = File.ReadAllLines(fileName);
            List<Lens> lenses = new List<Lens>();

            for (int i = 0; i < lines.Length; i++)
            {
                if (lines[i].StartsWith("Lens "))
                {
                    i += 1; // Skip "Lens " line
                    if (i < lines.Length && lines[i].StartsWith("Surface"))
                    {
                        i += 1; // Skip header line
                    }
                    if (i + 1 < lines.Length)
                    {
                        Surface front = ParseSurface(lines[i]);
                        Surface back = ParseSurface(lines[i + 1]);
                        lenses.Add(new Lens { Front = front, Back = back });
                        i += 1;
                    }
                    else
                    {
                        throw new FormatException("Incomplete lens data after header.");
                    }
                }
            }

            return lenses;
        }

        public static List<Surface> ParseSurfacesFromFile(string filePath)
        {
            List<Surface> surfaces = new List<Surface>();
            string[] lines = File.ReadAllLines(filePath);
            bool inSystemSection = false;

            foreach (string line in lines)
            {
                if (line.StartsWith("Optical system") || line.StartsWith("Optical system reversed"))
                {
                    inSystemSection = true;
                    continue;
                }
                if (inSystemSection)
                {
                    if (line.StartsWith("Surface"))
                        continue;
                    if (string.IsNullOrWhiteSpace(line) || line.StartsWith("Lens "))
                    {
                        inSystemSection = false;
                        continue;
                    }
                    string[] tokens = line.Split('\t');
                    if (tokens.Length < 6) // Now expect 6 parts
                        continue;

                    Surface surface = new Surface
                    {
                        Radius = double.Parse(tokens[1], CultureInfo.InvariantCulture),
                        Thickness = double.Parse(tokens[2], CultureInfo.InvariantCulture),
                        RefractiveIndex = double.Parse(tokens[3], CultureInfo.InvariantCulture),
                        Diameter = double.Parse(tokens[4], CultureInfo.InvariantCulture),
                        MechDiameter = double.Parse(tokens[5], CultureInfo.InvariantCulture)
                    };
                    surfaces.Add(surface);
                }
            }
            return surfaces;
        }

        private void buttonPrint_Click(object sender, EventArgs e)
        {
            WriteOpticalSystemToFile();
            WriteReversedOpticalSystemToFile();

            // Use a culture that accepts commas as decimal separators
            CultureInfo commaCulture = CultureInfo.GetCultureInfo("ru-RU"); // Comma as decimal separator

            double wavelength = 0;
            if (!double.TryParse(textBoxWavelength.Text, NumberStyles.Float, commaCulture, out wavelength))
            {
                MessageBox.Show("Неверное значение длины волны. Используется значение по умолчанию 0,550 мкм.");
                wavelength = 0.550; // Default value if parsing fails
            }
            else if (wavelength <= 0)
            {
                MessageBox.Show("Длина волны должна быть положительной. Используется значение по умолчанию 0,550 мкм.");
                wavelength = 0.550; // Default value if wavelength is not positive
            }



            PdfReportGenerator pdfGen = new PdfReportGenerator(
                dataGridViewLDE,
                ParseSurfacesFromFile("sys.txt"),
                ParseIndividualLensesFromFile("sys.txt"),
                loadedZmxFileName,
                wavelength
            );
            pdfGen.GeneratePdfReport();
        }

        private void buttonAbout_Click(object sender, EventArgs e)
        {
            AboutForm aboutForm = new AboutForm();
            aboutForm.ShowDialog();
        }

        private void buttonTraceRay_Click(object sender, EventArgs e)
        {

        }
    }



    /// <summary>
    /// Represents the glass data from a Zemax .agf catalog.
    /// For Sellmeier 1 (dispersion formula type 2), the coefficients K1, L1, K2, L2, K3, L3 are used.
    /// For Extended 2 (dispersion formula type 12), the coefficients A0 through A7 are used.
    /// </summary>
    public class GlassData
    {
        public int DispersionFormulaType { get; set; }

        // For Sellmeier 1 (formula type 2)
        public double K1 { get; set; }
        public double L1 { get; set; }
        public double K2 { get; set; }
        public double L2 { get; set; }
        public double K3 { get; set; }
        public double L3 { get; set; }

        // For Extended 2 (formula type 12)
        public double A0 { get; set; }
        public double A1 { get; set; }
        public double A2 { get; set; }
        public double A3 { get; set; }
        public double A4 { get; set; }
        public double A5 { get; set; }
        public double A6 { get; set; }
        public double A7 { get; set; }
    }

}