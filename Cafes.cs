using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;
using System.Diagnostics;
using System.Runtime.Serialization;

namespace Routes
{

    [DataContract]
    public class Cafe
    {

        [DataMember(Name = "id")]
        public int ID { get; set; }

        [DataMember(Name = "name")]
        public string Name { get; set; }

        [DataMember(Name = "placename")]
        public string PlaceName { get; set; }

        [DataMember(Name = "lat")]
        public double Lat{ get; set; }

        [DataMember(Name = "lng")]
        public double Lng { get; set; }

        [DataMember(Name = "daysopen")]
        public string DaysOpen { get; set; }

        [DataMember(Name = "timesopen")]
        public String TimesOpen { get; set; }

        [DataMember(Name = "notes")]
        public String Notes { get; set; }

        public Cafe(int id, string name, string placename, double lat, double lng, string daysopen, string timesopen, string notes)
        {
            ID = id;
            Name = name;
            PlaceName = placename;
            Lat = lat;
            Lng = lng;
            DaysOpen = daysopen;
            TimesOpen = timesopen;
            Notes = notes;

        }

    }

    
    public partial class Routes : IRoutes, IDisposable
    {
        public IEnumerable<Cafe> GetCafes()
        {
            LogEntry log = new LogEntry("GetCafes", "");

            List<Cafe> cafes = new List<Cafe>();

            if (gpxConnection.IsConnect())
            {
                try
                {
                    string query = string.Format("SELECT id,name,placename,lat,lng,daysopen,timesopen, notes FROM cafes");

                    using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataRoutes = new DataTable();
                        routeAdapter.Fill(dataRoutes);
                        int length = dataRoutes.Rows.Count;
                        for (int row = 0; row < length; row++)
                        {
                            string timesopen = "", daysopen = "", notes = "", name = "", placename = "";
                            int id; double lat, lng;
                            try
                            {
                                DataRow dr = dataRoutes.Rows[row];
                                id = (int)dr["id"];
                                name = (string)dr["name"];
                                placename = (string)dr["placename"];
                                timesopen = (string)dr["timesopen"];
                                notes = (string)dr["notes"];
                                lat = (double)dr["lat"];
                                lng = (double)dr["lng"];
                                daysopen = (string)dr["daysopen"];

                                cafes.Add(new Cafe(id, name, placename, lat, lng, daysopen, timesopen, notes));
                            }
                            catch (Exception ex)
                            {
                                Trace.WriteLine(ex.Message);
                                log.Error = ex.Message;
                            }
                        }
                    }
                }
                catch (Exception ex2)
                {
                    Trace.WriteLine(ex2.Message);
                    log.Error = ex2.Message;
                }
            }
            log.Result = cafes.Count.ToString() + " cafes found";
            log.Save(gpxConnection);
            gpxConnection.Close();
            return cafes;
        }
        public string SaveCafe(Cafe cafe)
        {
            LogEntry log = new LogEntry("SaveCafe", cafe.ID + " " + cafe.Name);

            cafe.Name = cafe.Name.Replace("'", "''");
            cafe.Notes = cafe.Notes.Replace("'", "''");
            cafe.PlaceName = cafe.PlaceName.Replace("'", "''");

            string result = "";
            if (gpxConnection.IsConnect())
            {
                try
                {
                    string query;
                    //// check ride with same leader and date isn't already there ***************

                    //string query = string.Format("SELECT dest FROM rides where date= '{0}' and leaderName = '{1}'", ride.Date, ride.LeaderName);
                    //bool exists = true;
                    //string now = Logdata.TimeString(DateTime.Now);
                    //string rideDest = "";
                    //using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    //{
                    //    dataRoutes = new DataTable();
                    //    routeAdapter.Fill(dataRoutes);

                    //    if (dataRoutes.Rows.Count == 0)
                    //    {
                    //        exists = false;
                    //    }
                    //    else
                    //    {
                    //        DataRow dr = dataRoutes.Rows[0];
                    //        try { rideDest = (string)dr["dest"]; } catch { }
                    //    }
                    //}
                    //if (exists)
                    //{
                    //    result = string.Format("There is already a ride with you as leader on the same date. Please choose another date.");
                    //}
                    if (cafe.ID > 0)
                    {
                        // already exists, just update

                    }
                    else
                    {

                        using (System.Net.WebClient client = new System.Net.WebClient())
                        {

                            query = string.Format("insert into cafes (lat,lng,name,placename,notes,daysopen,timesopen) values ({0},{1},'{2}','{3}','{4}','{5}','{6}')",
                                cafe.Lat,cafe.Lng,cafe.Name,cafe.PlaceName,cafe.Notes,cafe.DaysOpen, cafe.TimesOpen);
                            // get new ride ID
                            query += "; SELECT CAST(LAST_INSERT_ID() AS int)";
                            object cafeID = null;

                            using (MySqlCommand command = new MySqlCommand(query, gpxConnection.Connection))
                            {
                                cafeID = command.ExecuteScalar();
                            }
                            // return id of new cafe
                            result = cafeID.ToString();
                        }
                        //}
                    }
                }
                catch (Exception ex)
                {
                    result = string.Format("Database error: ride \"{0}\" not saved: {1}", cafe.Name, ex.Message);
                }


                finally
                {
                    log.Result = result;
                    log.Save(gpxConnection);
                    gpxConnection.Close();
                }
            }
            return result;

        }



    }
}