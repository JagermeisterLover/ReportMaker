using System;
using System.ComponentModel;

namespace ReportMaker
{
    public class Surface : INotifyPropertyChanged
    {
        private double radius;
        private double thickness;
        private string material;
        private double semiDiameter;
        private double diameter;
        private bool isBase;
        private double decenterMm;
        private double decenterDMS;
        private int decenterDeg;
        private int decenterMin;
        private double decenterSec;
        private string extra;
        private double refractiveIndex;
        private bool updatingDecenter = false;
        private double phi; // Added Phi property
        public event PropertyChangedEventHandler PropertyChanged;

        private double mechHeight;
        private double mechDiameter;

        protected void OnPropertyChanged(string propName) =>
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propName));

        public bool SuppressRecalc { get; set; }

        public Surface()
        {
            Radius = double.PositiveInfinity;
            Thickness = 0;
            SemiDiameter = 0;
            Material = string.Empty;
            isBase = false;
            decenterDMS = 1.0 / 60.0;
            decenterMm = 0;
            UpdateDecenterComponents();
            extra = string.Empty;
            refractiveIndex = 0;
            Phi = 0; // Initialize Phi
            SuppressRecalc = false;
        }

        public double Radius
        {
            get => radius;
            set
            {
                if (Math.Abs(radius - value) > 1e-12)
                {
                    radius = value;
                    OnPropertyChanged(nameof(Radius));
                    if (!SuppressRecalc && !updatingDecenter)
                    {
                        updatingDecenter = true;
                        if (radius != double.PositiveInfinity && radius != 0)
                            decenterMm = Math.Tan(decenterDMS * Math.PI / 180.0) * radius;
                        else
                            decenterMm = 0;
                        OnPropertyChanged(nameof(DecenterMm));
                        updatingDecenter = false;
                    }
                }
            }
        }

        public double MechHeight
        {
            get => mechHeight;
            set
            {
                if (Math.Abs(mechHeight - value) > 1e-12)
                {
                    mechHeight = value;
                    mechDiameter = mechHeight * 2;
                    OnPropertyChanged(nameof(MechHeight));
                    OnPropertyChanged(nameof(MechDiameter));
                }
            }
        }

        public double MechDiameter
        {
            get => mechDiameter;
            set
            {
                if (Math.Abs(mechDiameter - value) > 1e-12)
                {
                    mechDiameter = value;
                    mechHeight = mechDiameter / 2;
                    OnPropertyChanged(nameof(MechDiameter));
                    OnPropertyChanged(nameof(MechHeight));
                }
            }
        }

        public double Thickness
        {
            get => thickness;
            set
            {
                if (Math.Abs(thickness - value) > 1e-12)
                {
                    thickness = value;
                    OnPropertyChanged(nameof(Thickness));
                }
            }
        }

        public string Material
        {
            get => material;
            set
            {
                if (material != value)
                {
                    material = value;
                    OnPropertyChanged(nameof(Material));
                }
            }
        }

        public double SemiDiameter
        {
            get => semiDiameter;
            set
            {
                if (Math.Abs(semiDiameter - value) > 1e-12)
                {
                    semiDiameter = value;
                    diameter = semiDiameter * 2;
                    OnPropertyChanged(nameof(SemiDiameter));
                    OnPropertyChanged(nameof(Diameter));
                }
            }
        }

        public double Diameter
        {
            get => diameter;
            set
            {
                if (Math.Abs(diameter - value) > 1e-12)
                {
                    diameter = value;
                    semiDiameter = diameter / 2;
                    OnPropertyChanged(nameof(Diameter));
                    OnPropertyChanged(nameof(SemiDiameter));
                }
            }
        }

        public bool Base
        {
            get => isBase;
            set
            {
                if (isBase != value)
                {
                    isBase = value;
                    OnPropertyChanged(nameof(Base));
                }
            }
        }

        public double DecenterMm
        {
            get => decenterMm;
            set
            {
                if (Math.Abs(decenterMm - value) > 1e-12)
                {
                    decenterMm = value;
                    OnPropertyChanged(nameof(DecenterMm));
                    if (!updatingDecenter)
                    {
                        updatingDecenter = true;
                        double angle = 0;
                        if (Radius != double.PositiveInfinity && Radius != 0)
                            angle = Math.Atan(decenterMm / Radius) * (180.0 / Math.PI);
                        DecenterDMS = angle;
                        updatingDecenter = false;
                    }
                }
            }
        }

        public double DecenterDMS
        {
            get => decenterDMS;
            set
            {
                if (Math.Abs(decenterDMS - value) > 1e-12)
                {
                    decenterDMS = value;
                    OnPropertyChanged(nameof(DecenterDMS));
                    UpdateDecenterComponents();
                    if (!updatingDecenter)
                    {
                        updatingDecenter = true;
                        double newDecenterMm = 0;
                        if (Radius != double.PositiveInfinity && Radius != 0)
                            newDecenterMm = Math.Tan(decenterDMS * Math.PI / 180.0) * Radius;
                        decenterMm = newDecenterMm;
                        OnPropertyChanged(nameof(DecenterMm));
                        updatingDecenter = false;
                    }
                }
            }
        }

        public int DecenterDeg
        {
            get => decenterDeg;
            set
            {
                if (decenterDeg != value)
                {
                    decenterDeg = value;
                    OnPropertyChanged(nameof(DecenterDeg));
                    if (!updatingDecenter)
                    {
                        updatingDecenter = true;
                        UpdateDecenterFromComponents();
                        updatingDecenter = false;
                    }
                }
            }
        }

        public int DecenterMin
        {
            get => decenterMin;
            set
            {
                if (decenterMin != value)
                {
                    decenterMin = value;
                    OnPropertyChanged(nameof(DecenterMin));
                    if (!updatingDecenter)
                    {
                        updatingDecenter = true;
                        UpdateDecenterFromComponents();
                        updatingDecenter = false;
                    }
                }
            }
        }

        public double DecenterSec
        {
            get => decenterSec;
            set
            {
                if (Math.Abs(decenterSec - value) > 1e-12)
                {
                    decenterSec = value;
                    OnPropertyChanged(nameof(DecenterSec));
                    if (!updatingDecenter)
                    {
                        updatingDecenter = true;
                        UpdateDecenterFromComponents();
                        updatingDecenter = false;
                    }
                }
            }
        }

        public double RefractiveIndex
        {
            get => refractiveIndex;
            set
            {
                if (Math.Abs(refractiveIndex - value) > 1e-12)
                {
                    refractiveIndex = value;
                    OnPropertyChanged(nameof(RefractiveIndex));
                }
            }
        }

        public string Extra
        {
            get => extra;
            set
            {
                if (extra != value)
                {
                    extra = value;
                    OnPropertyChanged(nameof(Extra));
                }
            }
        }

        public double Phi
        {
            get => phi;
            set
            {
                if (Math.Abs(phi - value) > 1e-12)
                {
                    phi = value;
                    OnPropertyChanged(nameof(Phi));
                }
            }
        }

        private void UpdateDecenterComponents()
        {
            double angle = decenterDMS;
            decenterDeg = (int)Math.Floor(angle);
            double remainder = angle - decenterDeg;
            decenterMin = (int)Math.Floor(remainder * 60);
            decenterSec = (remainder * 60 - decenterMin) * 60;
            OnPropertyChanged(nameof(DecenterDeg));
            OnPropertyChanged(nameof(DecenterMin));
            OnPropertyChanged(nameof(DecenterSec));
        }

        private void UpdateDecenterFromComponents()
        {
            double newAngle = decenterDeg + decenterMin / 60.0 + decenterSec / 3600.0;
            if (Math.Abs(decenterDMS - newAngle) > 1e-12)
            {
                decenterDMS = newAngle;
                OnPropertyChanged(nameof(DecenterDMS));
                double newDecenterMm = 0;
                if (Radius != double.PositiveInfinity && Radius != 0)
                    newDecenterMm = Math.Tan(decenterDMS * Math.PI / 180.0) * Radius;
                decenterMm = newDecenterMm;
                OnPropertyChanged(nameof(DecenterMm));
            }
        }
    }
}