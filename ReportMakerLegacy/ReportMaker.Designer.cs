namespace ReportMaker
{
    partial class ReportMaker
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ReportMaker));
            panelButtons = new Panel();
            label6 = new Label();
            label5 = new Label();
            textBoxWaveRaytrace = new TextBox();
            label7 = new Label();
            textBoxStopSize = new TextBox();
            label4 = new Label();
            checkBoxPrintRaysLayout = new CheckBox();
            textBoxPx = new TextBox();
            label3 = new Label();
            textBoxPy = new TextBox();
            label1 = new Label();
            buttonRaysLayout = new Button();
            textBoxNumRays = new TextBox();
            label2 = new Label();
            buttonTraceRay = new Button();
            buttonAbout = new Button();
            buttonPrint = new Button();
            buttonDraw = new Button();
            btnAutocollimation = new Button();
            labelMicron = new Label();
            textBoxWavelength = new TextBox();
            labelWavelength = new Label();
            btnOpen = new Button();
            panelData = new Panel();
            dataGridViewLDE = new DataGridView();
            panelButtons.SuspendLayout();
            panelData.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)dataGridViewLDE).BeginInit();
            SuspendLayout();
            // 
            // panelButtons
            // 
            panelButtons.BackgroundImage = (Image)resources.GetObject("panelButtons.BackgroundImage");
            panelButtons.BackgroundImageLayout = ImageLayout.Stretch;
            panelButtons.Controls.Add(label6);
            panelButtons.Controls.Add(label5);
            panelButtons.Controls.Add(textBoxWaveRaytrace);
            panelButtons.Controls.Add(label7);
            panelButtons.Controls.Add(textBoxStopSize);
            panelButtons.Controls.Add(label4);
            panelButtons.Controls.Add(checkBoxPrintRaysLayout);
            panelButtons.Controls.Add(textBoxPx);
            panelButtons.Controls.Add(label3);
            panelButtons.Controls.Add(textBoxPy);
            panelButtons.Controls.Add(label1);
            panelButtons.Controls.Add(buttonRaysLayout);
            panelButtons.Controls.Add(textBoxNumRays);
            panelButtons.Controls.Add(label2);
            panelButtons.Controls.Add(buttonTraceRay);
            panelButtons.Controls.Add(buttonAbout);
            panelButtons.Controls.Add(buttonPrint);
            panelButtons.Controls.Add(buttonDraw);
            panelButtons.Controls.Add(btnAutocollimation);
            panelButtons.Controls.Add(labelMicron);
            panelButtons.Controls.Add(textBoxWavelength);
            panelButtons.Controls.Add(labelWavelength);
            panelButtons.Controls.Add(btnOpen);
            panelButtons.Location = new Point(0, 0);
            panelButtons.Name = "panelButtons";
            panelButtons.Size = new Size(1785, 150);
            panelButtons.TabIndex = 0;
            // 
            // label6
            // 
            label6.AutoSize = true;
            label6.BackColor = Color.Transparent;
            label6.ForeColor = SystemColors.ControlLightLight;
            label6.Location = new Point(1088, 119);
            label6.Name = "label6";
            label6.Size = new Size(31, 20);
            label6.TabIndex = 10;
            label6.Text = "µm";
            // 
            // label5
            // 
            label5.AutoSize = true;
            label5.BackColor = Color.Transparent;
            label5.ForeColor = SystemColors.ControlLightLight;
            label5.Location = new Point(1098, 87);
            label5.Name = "label5";
            label5.Size = new Size(31, 20);
            label5.TabIndex = 23;
            label5.Text = "мм";
            // 
            // textBoxWaveRaytrace
            // 
            textBoxWaveRaytrace.Location = new Point(1002, 116);
            textBoxWaveRaytrace.Name = "textBoxWaveRaytrace";
            textBoxWaveRaytrace.RightToLeft = RightToLeft.No;
            textBoxWaveRaytrace.Size = new Size(80, 27);
            textBoxWaveRaytrace.TabIndex = 9;
            textBoxWaveRaytrace.Text = "0,6328";
            // 
            // label7
            // 
            label7.AutoSize = true;
            label7.BackColor = Color.Transparent;
            label7.ForeColor = SystemColors.ControlLightLight;
            label7.Location = new Point(887, 119);
            label7.Name = "label7";
            label7.Size = new Size(103, 20);
            label7.TabIndex = 8;
            label7.Text = "Длина волны";
            // 
            // textBoxStopSize
            // 
            textBoxStopSize.Location = new Point(1035, 84);
            textBoxStopSize.Name = "textBoxStopSize";
            textBoxStopSize.RightToLeft = RightToLeft.No;
            textBoxStopSize.Size = new Size(57, 27);
            textBoxStopSize.TabIndex = 22;
            textBoxStopSize.Text = "18";
            // 
            // label4
            // 
            label4.AutoSize = true;
            label4.BackColor = Color.Transparent;
            label4.ForeColor = SystemColors.ControlLightLight;
            label4.Location = new Point(886, 87);
            label4.Name = "label4";
            label4.Size = new Size(143, 20);
            label4.TabIndex = 21;
            label4.Text = "Диаметр апертуры";
            // 
            // checkBoxPrintRaysLayout
            // 
            checkBoxPrintRaysLayout.AutoSize = true;
            checkBoxPrintRaysLayout.BackColor = Color.Transparent;
            checkBoxPrintRaysLayout.Checked = true;
            checkBoxPrintRaysLayout.CheckState = CheckState.Checked;
            checkBoxPrintRaysLayout.ForeColor = SystemColors.ControlLightLight;
            checkBoxPrintRaysLayout.Location = new Point(664, 86);
            checkBoxPrintRaysLayout.Name = "checkBoxPrintRaysLayout";
            checkBoxPrintRaysLayout.Size = new Size(165, 24);
            checkBoxPrintRaysLayout.TabIndex = 20;
            checkBoxPrintRaysLayout.Text = "Печать хода лучей";
            checkBoxPrintRaysLayout.UseVisualStyleBackColor = false;
            // 
            // textBoxPx
            // 
            textBoxPx.Location = new Point(1032, 48);
            textBoxPx.Name = "textBoxPx";
            textBoxPx.RightToLeft = RightToLeft.No;
            textBoxPx.Size = new Size(46, 27);
            textBoxPx.TabIndex = 19;
            textBoxPx.Text = "0";
            // 
            // label3
            // 
            label3.AutoSize = true;
            label3.BackColor = Color.Transparent;
            label3.ForeColor = SystemColors.ControlLightLight;
            label3.Location = new Point(1002, 51);
            label3.Name = "label3";
            label3.Size = new Size(26, 20);
            label3.TabIndex = 18;
            label3.Text = "Px";
            // 
            // textBoxPy
            // 
            textBoxPy.Location = new Point(946, 48);
            textBoxPy.Name = "textBoxPy";
            textBoxPy.RightToLeft = RightToLeft.No;
            textBoxPy.Size = new Size(46, 27);
            textBoxPy.TabIndex = 17;
            textBoxPy.Text = "1";
            // 
            // label1
            // 
            label1.AutoSize = true;
            label1.BackColor = Color.Transparent;
            label1.ForeColor = SystemColors.ControlLightLight;
            label1.Location = new Point(916, 51);
            label1.Name = "label1";
            label1.Size = new Size(26, 20);
            label1.TabIndex = 16;
            label1.Text = "Py";
            // 
            // buttonRaysLayout
            // 
            buttonRaysLayout.Location = new Point(659, 12);
            buttonRaysLayout.Name = "buttonRaysLayout";
            buttonRaysLayout.Size = new Size(177, 29);
            buttonRaysLayout.TabIndex = 15;
            buttonRaysLayout.Text = "Ход лучей";
            buttonRaysLayout.UseVisualStyleBackColor = true;
            // 
            // textBoxNumRays
            // 
            textBoxNumRays.Location = new Point(756, 48);
            textBoxNumRays.Name = "textBoxNumRays";
            textBoxNumRays.RightToLeft = RightToLeft.No;
            textBoxNumRays.Size = new Size(80, 27);
            textBoxNumRays.TabIndex = 14;
            textBoxNumRays.Text = "1000";
            // 
            // label2
            // 
            label2.AutoSize = true;
            label2.BackColor = Color.Transparent;
            label2.ForeColor = SystemColors.ControlLightLight;
            label2.Location = new Point(659, 51);
            label2.Name = "label2";
            label2.Size = new Size(91, 20);
            label2.TabIndex = 13;
            label2.Text = "Количество";
            // 
            // buttonTraceRay
            // 
            buttonTraceRay.Location = new Point(915, 12);
            buttonTraceRay.Name = "buttonTraceRay";
            buttonTraceRay.Size = new Size(173, 29);
            buttonTraceRay.TabIndex = 12;
            buttonTraceRay.Text = "Трассировка луча";
            buttonTraceRay.UseVisualStyleBackColor = true;
            buttonTraceRay.Click += buttonTraceRay_Click;
            // 
            // buttonAbout
            // 
            buttonAbout.Location = new Point(1595, 12);
            buttonAbout.Name = "buttonAbout";
            buttonAbout.Size = new Size(117, 29);
            buttonAbout.TabIndex = 11;
            buttonAbout.Text = "О программе";
            buttonAbout.UseVisualStyleBackColor = true;
            buttonAbout.Click += buttonAbout_Click;
            // 
            // buttonPrint
            // 
            buttonPrint.Location = new Point(497, 12);
            buttonPrint.Name = "buttonPrint";
            buttonPrint.Size = new Size(92, 29);
            buttonPrint.TabIndex = 10;
            buttonPrint.Text = "Печать";
            buttonPrint.UseVisualStyleBackColor = true;
            buttonPrint.Click += buttonPrint_Click;
            // 
            // buttonDraw
            // 
            buttonDraw.Location = new Point(376, 12);
            buttonDraw.Name = "buttonDraw";
            buttonDraw.Size = new Size(115, 29);
            buttonDraw.TabIndex = 9;
            buttonDraw.Text = "Рисунок";
            buttonDraw.UseVisualStyleBackColor = true;
            buttonDraw.Click += buttonDraw_Click;
            // 
            // btnAutocollimation
            // 
            btnAutocollimation.Location = new Point(144, 12);
            btnAutocollimation.Name = "btnAutocollimation";
            btnAutocollimation.Size = new Size(226, 29);
            btnAutocollimation.TabIndex = 8;
            btnAutocollimation.Text = "Автоколлимационные точки";
            btnAutocollimation.UseVisualStyleBackColor = true;
            btnAutocollimation.Click += btnAutocollimation_Click;
            // 
            // labelMicron
            // 
            labelMicron.AutoSize = true;
            labelMicron.BackColor = Color.Transparent;
            labelMicron.ForeColor = SystemColors.ControlLightLight;
            labelMicron.Location = new Point(221, 54);
            labelMicron.Name = "labelMicron";
            labelMicron.Size = new Size(31, 20);
            labelMicron.TabIndex = 7;
            labelMicron.Text = "µm";
            // 
            // textBoxWavelength
            // 
            textBoxWavelength.Location = new Point(135, 51);
            textBoxWavelength.Name = "textBoxWavelength";
            textBoxWavelength.RightToLeft = RightToLeft.No;
            textBoxWavelength.Size = new Size(80, 27);
            textBoxWavelength.TabIndex = 6;
            textBoxWavelength.Text = "0,54607";
            textBoxWavelength.TextChanged += textBoxWavelength_TextChanged;
            // 
            // labelWavelength
            // 
            labelWavelength.AutoSize = true;
            labelWavelength.BackColor = Color.Transparent;
            labelWavelength.ForeColor = SystemColors.ControlLightLight;
            labelWavelength.Location = new Point(23, 54);
            labelWavelength.Name = "labelWavelength";
            labelWavelength.Size = new Size(103, 20);
            labelWavelength.TabIndex = 5;
            labelWavelength.Text = "Длина волны";
            // 
            // btnOpen
            // 
            btnOpen.Location = new Point(21, 12);
            btnOpen.Name = "btnOpen";
            btnOpen.Size = new Size(117, 29);
            btnOpen.TabIndex = 3;
            btnOpen.Text = "Открыть .zmx";
            btnOpen.UseVisualStyleBackColor = true;
            btnOpen.Click += btnOpen_Click;
            // 
            // panelData
            // 
            panelData.Controls.Add(dataGridViewLDE);
            panelData.Location = new Point(3, 162);
            panelData.Name = "panelData";
            panelData.Size = new Size(1720, 795);
            panelData.TabIndex = 1;
            // 
            // dataGridViewLDE
            // 
            dataGridViewLDE.BackgroundColor = SystemColors.ControlLightLight;
            dataGridViewLDE.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dataGridViewLDE.Location = new Point(9, 14);
            dataGridViewLDE.Name = "dataGridViewLDE";
            dataGridViewLDE.RowHeadersWidth = 51;
            dataGridViewLDE.SelectionMode = DataGridViewSelectionMode.CellSelect;
            dataGridViewLDE.Size = new Size(1709, 773);
            dataGridViewLDE.TabIndex = 0;
            // 
            // ReportMaker
            // 
            AutoScaleDimensions = new SizeF(9F, 20F);
            AutoScaleMode = AutoScaleMode.Font;
            BackColor = SystemColors.ControlLightLight;
            ClientSize = new Size(1724, 961);
            Controls.Add(panelData);
            Controls.Add(panelButtons);
            DoubleBuffered = true;
            Font = new Font("Segoe UI Semibold", 9F, FontStyle.Bold, GraphicsUnit.Point, 204);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            Icon = (Icon)resources.GetObject("$this.Icon");
            Name = "ReportMaker";
            StartPosition = FormStartPosition.CenterScreen;
            Text = "ReportMaker";
            panelButtons.ResumeLayout(false);
            panelButtons.PerformLayout();
            panelData.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)dataGridViewLDE).EndInit();
            ResumeLayout(false);
        }

        #endregion

        private Panel panelButtons;
        private PictureBox btnPlot;
        private PictureBox btnSave;
        private Panel panelData;
        private DataGridView dataGridViewLDE;
        private Button btnOpen;
        private Label labelMicron;
        private TextBox textBoxWavelength;
        private Label labelWavelength;
        private Button btnLoadCatalog;
        private Button btnAutocollimation;
        private Button buttonDraw;
        private Button buttonPrint;
        private Button buttonAbout;
        private Button buttonTraceRay;
        private TextBox textBoxPx;
        private Label label3;
        private TextBox textBoxPy;
        private Label label1;
        private Button buttonRaysLayout;
        private TextBox textBoxNumRays;
        private Label label2;
        private CheckBox checkBoxPrintRaysLayout;
        private TextBox textBoxStopSize;
        private Label label4;
        private Label label6;
        private Label label5;
        private TextBox textBoxWaveRaytrace;
        private Label label7;
    }
}
