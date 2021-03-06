﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Linq;

//Copyright (c) 2008 http://peterkellner.net


//Permission is hereby granted, free of charge, to any person
//obtaining a copy of this software and associated documentation
//files (the "Software"), to deal in the Software without
//restriction, including without limitation the rights to use,
//copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the
//Software is furnished to do so, subject to the following
//conditions:

//The above copyright notice and this permission notice shall be
//included in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
//EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
//OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
//NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
//HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
//WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
//FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
//OTHER DEALINGS IN THE SOFTWARE.

namespace Routes
{
    public class Position
    {
        public double LatitudeDegrees { set; get; }
        public double LongitudeDegrees { set; get; }
    }

    public class TrackPoint
    {
        double altMeters;
        static double lastAltMeters = 0;
       // public string altString { get; set; }
        public double AltitudeMeters
        {
            get => altMeters;
            set
            {
                altMeters = value;
                if (Double.IsNaN(altMeters))
                    altMeters = lastAltMeters;
                else
                    lastAltMeters = altMeters;
            }
        }
        public double DistanceMeters { get; set; }
        public List<Position> Positionx { get; set; }
    }

    public class Track
    {
        public List<TrackPoint> TrackPoints { set; get; }
    }

    /// <summary>
    /// Summary description for GarminTrack
    /// </summary>
    public class GarminTrack
    {
        static XElement root;
        readonly static XNamespace ns1 = "http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2";

        public static void SetRoot(string f)
        {
            root = XElement.Load(f);
        }
        public static void SetRoot(System.IO.TextReader tr)
        {
            root = XElement.Load(tr);
        }
        static string RouteName()
        {
            // obtain a single element with specific tag (first instance), useful if only expecting one instance of the tag in the target doc
            XElement nameElement = (from c in root.Descendants(ns1 + "Name") select c).First();
            return nameElement.Value;
        }

        static Track ParseTCX()
        {
            IEnumerable<Track> tracks =
                    from trackElement in root.Descendants(ns1 + "Track")
                    select new Track
                    {
                        TrackPoints =
                            (from trackPointElement in trackElement.Descendants(ns1 + "Trackpoint")
                             select new TrackPoint
                             {
                                  AltitudeMeters = trackPointElement.Element(ns1 + "AltitudeMeters") != null
                                                 ? Convert.ToDouble(trackPointElement.Element(ns1 + "AltitudeMeters").Value) : 0.0,
                                 

                                 DistanceMeters = trackPointElement.Element(ns1 + "DistanceMeters") != null
                                                 ? Convert.ToDouble(trackPointElement.Element(ns1 + "DistanceMeters").Value) : 0.0,

                                 Positionx =
                                     (from positionElement in trackPointElement.Descendants(ns1 + "Position")
                                      select new Position
                                      {
                                          LatitudeDegrees = Convert.ToDouble(positionElement.Element(ns1 + "LatitudeDegrees").Value),
                                          LongitudeDegrees = Convert.ToDouble(positionElement.Element(ns1 + "LongitudeDegrees").Value),
                                     
                                    }).ToList()
                                }).ToList()
                    };

            return tracks.SingleOrDefault();
        }
 

        public static string CreateGPX()
        {

            var trkseg = new XElement("trkseg");
            XElement GPX = new XElement("gpx",
                new XAttribute("version", "1.0"),
                new XAttribute("creator", "quilkin.com"),
                new XElement("trk",
                    new XElement("name", RouteName()),
                    trkseg
                )
            );

            Track track = ParseTCX();
            int count = 0;

            foreach (TrackPoint tp in track.TrackPoints)
            {
                Position pos = tp.Positionx[0];
                trkseg.Add(new XElement("trkpt",
                    new XAttribute("lat", pos.LatitudeDegrees),
                    new XAttribute("lon", pos.LongitudeDegrees),
                    new XElement("ele", tp.AltitudeMeters)));

                count++;
            }
            return GPX.ToString();
        }
    }
}