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

        [DataMember(Name = "user")]
        public string User { get; set; }

        [DataMember(Name = "updated")]
        public string Updated { get; set; }

        public Cafe(int id, string name, string placename, double lat, double lng, string daysopen, string timesopen, string notes, string user, string updated)
        {
            ID = id;
            Name = name;
            PlaceName = placename;
            Lat = lat;
            Lng = lng;
            DaysOpen = daysopen;
            TimesOpen = timesopen;
            Notes = notes;
            User = user;
            Updated = updated;
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
                    //string query = string.Format("SELECT id,name,placename,lat,lng,daysopen,timesopen, notes, user FROM cafes");
                    string query = string.Format("SELECT * FROM cafes");

                    using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataRoutes = new DataTable();
                        routeAdapter.Fill(dataRoutes);
                        int length = dataRoutes.Rows.Count;
                        for (int row = 0; row < length; row++)
                        {
                            string timesopen = "", daysopen = "", notes = "", name = "", placename = "", user = "";
                            int id; double lat, lng;
                            DateTime updated;
                            try
                            {
                                DataRow dr = dataRoutes.Rows[row];
                                id = (int)dr["id"];
                                name = (string)dr["name"];
                                placename = (string)dr["placename"];
                                timesopen = (string)dr["timesopen"];
                                notes = (string)dr["notes"];
                                user = (string)dr["user"];
                                lat = (double)dr["lat"];
                                lng = (double)dr["lng"];
                                daysopen = (string)dr["daysopen"];
                                updated = (DateTime)dr["updated"];

                                cafes.Add(new Cafe(id, name, placename, lat, lng, daysopen, timesopen, notes, user, updated.ToString()));
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
                finally
                {
                    log.Result = cafes.Count.ToString() + " cafes found";
                    log.Save(gpxConnection);
                    gpxConnection.Close();
                }
            }
            return cafes;
        }
        public string SaveCafe(Cafe cafe)
        {
            cafe.Name = GetRidOfApostrophes(cafe.Name);
            cafe.Notes = GetRidOfApostrophes(cafe.Notes);
            cafe.PlaceName = GetRidOfApostrophes(cafe.PlaceName);
            cafe.TimesOpen = GetRidOfApostrophes(cafe.TimesOpen);
            cafe.DaysOpen = GetRidOfApostrophes(cafe.DaysOpen);


            LogEntry log = new LogEntry("SaveCafe", cafe.ID + " " + cafe.Name + " " + cafe.User);

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

                   // using (System.Net.WebClient client = new System.Net.WebClient())
                    {
                        if (cafe.ID > 0)
                        {
                            // already exists, just update

                            query = string.Format("update cafes set name = '{0}',placename = '{1}', notes = '{2}',daysopen = '{3}',timesopen ='{4}',user ='{5}', updated = '{6}' where id = {7} ",
                                            cafe.Name, cafe.PlaceName, cafe.Notes, cafe.DaysOpen, cafe.TimesOpen, cafe.User, Logdata.DBTimeString(DateTime.Now), cafe.ID);

                            using (MySqlCommand command = new MySqlCommand(query, gpxConnection.Connection))
                            {
                                command.ExecuteNonQuery();
                            }

                            result = "0";

                        }
                        else
                        {
                            query = string.Format("insert into cafes (lat,lng,name,placename,notes,daysopen,timesopen,user,updated) values ({0},{1},'{2}','{3}','{4}','{5}','{6}','{7}','{8}')",
                                cafe.Lat, cafe.Lng, cafe.Name, cafe.PlaceName, cafe.Notes, cafe.DaysOpen, cafe.TimesOpen, cafe.User, Logdata.DBTimeString(DateTime.Now));
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
                    }
                }
                catch (Exception ex)
                {
                    result = string.Format("Database error: ride \"{0}\" not saved: {1}", cafe.Name, ex.Message);
                    log.Error = ex.Message;
                }


                finally
                {
                    log.Result = result;
                    log.Save(gpxConnection);
                    gpxConnection.Close();
                }
            }
            else
                return DBConnection.ErrStr;
            return result;

        }

        public string DeleteCafe(int cafeID)
        {
            LogEntry log = new LogEntry("DeleteCafe ", cafeID.ToString());

            int successRows = 0;
            string result = "";
            if (gpxConnection.IsConnect())
            {
                try
                {
                    string query = string.Format("delete from cafes where id = {0}", cafeID);
                    using (MySqlCommand command = new MySqlCommand(query, gpxConnection.Connection))
                    {
                        successRows = command.ExecuteNonQuery();
                    }
                    result = "OK";
                }
                catch (Exception ex)
                {
                    result = string.Format("Database error: {0}", ex.Message);
                }
                finally
                {
                    log.Result = result;
                    log.Save(gpxConnection);
                    gpxConnection.Close();
                }
            }
            else
                return DBConnection.ErrStr;

            return result;
        }


    }
}