using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Data;
using MySql.Data.MySqlClient;
using System.Diagnostics;

using System.Xml;
using System.Runtime.Serialization;

namespace Routes
{
    [DataContract]
    public class Route
    {
        [DataMember(Name = "url")]
        public string URL { get; set; }
        [DataMember(Name = "dest")]
        public string Dest { get; set; }
        [DataMember(Name = "distance")]
        public int Distance { get; set; }
        [DataMember(Name = "description")]
        public string Descrip { get; set; }

        [DataMember(Name = "climbing")]
        public int Climbing { get; set; }
        [DataMember(Name = "owner")]
        public int Owner { get; set; }
        [DataMember(Name = "id")]
        public int ID { get; set; }


        public Route(string url, string dest, string descrip, int d, int climb, int ow, int id)
        {
            URL = url;
            Dest = dest;
            Descrip = descrip;
            Distance = d;
            Climbing = climb;
            Owner = ow;
            //Date = date;
            //Time = time;
            //Place = place;
            ID = id;
        }

    }

    public partial class Routes : IRoutes, IDisposable
    {

        DBConnection gpxConnection = DBConnection.Instance();

        DataTable dataRoutes;
        List<Route> routes;
        List<Ride> rides;
        DataTable dataLogins;

        public Routes()
        {
        }
        public void Dispose()
        {
            if (dataLogins != null)
                dataLogins.Dispose();
            if (gpxConnection != null)
                gpxConnection.Close();
        }



        public string TestService()
        {
            return "Service found and working!";
        }


        public string SaveRoute(Route route)
        {
            LogEntry log = new LogEntry("SaveRoute", route.ID + " " + route.Dest);

            //int successRows = 0;
            string result = "";
            if (gpxConnection.IsConnect())
            {
                try
                {

                    // fetch the text from the URL
                    string fullText;
                    try
                    {
                        using (System.Net.WebClient client = new System.Net.WebClient())
                        {
                            if (route.URL == "none" || route.URL.Length > 1000)
                            {
                                // either no GPX available, or full GPX has been uploaded
                                fullText = route.URL;
                            }

                            else
                            {
                                fullText = client.DownloadString(route.URL);

                                XmlDocument xmldoc = new XmlDocument();
                                // will catch if not valid XML
                                xmldoc.LoadXml(fullText);
                            }


                            string query = string.Format("insert into routes (dest,distance,description,climbing,route,owner) values ('{0}','{1}','{2}','{3}','{4}','{5}')",
                                route.Dest, route.Distance, route.Descrip, route.Climbing, fullText, route.Owner);
                            query += "; SELECT CAST(LAST_INSERT_ID() AS int)";
                            object routeID = null;

                            using (MySqlCommand command = new MySqlCommand(query, gpxConnection.Connection))
                            {
                                //successRows = command.ExecuteNonQuery();
                                routeID = command.ExecuteScalar();
                            }

                            result = routeID.ToString();

                        }
                    }
                    catch (Exception ex2)
                    {
                        result = string.Format("Database error: route \"{0}\" not saved: {1}", route.Dest, ex2.Message);
                    }

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
            return result;

        }

        public IEnumerable<Route> GetRouteSummaries()
        {
            // get details of all routes (but not yet the GPX data)
            LogEntry log = new LogEntry("GetRouteSummaries", "");

            routes = new List<Route>();

            if (gpxConnection.IsConnect())
            {
                try
                {
                    string query = string.Format("SELECT id,dest,description,distance,climbing,owner FROM routes ");

                    using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataRoutes = new DataTable();
                        routeAdapter.Fill(dataRoutes);
                        int length = dataRoutes.Rows.Count;
                        for (int row = 0; row < length; row++)
                        {
                            string dest = "", descrip = "";
                            int id, owner = 0, climbing = 0, distance = 0;
                            try
                            {
                                DataRow dr = dataRoutes.Rows[row];
                                id = (int)dr["id"];
                                try { dest = (string)dr["dest"]; } catch { }
                                try { descrip = (string)dr["description"]; } catch { }
                                try { climbing = (int)dr["climbing"]; } catch { }
                                try { distance = (int)dr["distance"]; } catch { }
                                try { owner = (int)dr["owner"]; } catch { }

                                routes.Add(new Route(null, dest, descrip, distance, climbing, owner, id));
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
            log.Result = routes.Count.ToString() + " routes altogether";
            log.Save(gpxConnection);
            gpxConnection.Close();
            return routes;
        }
        public string GetGPXforRoute(int routeID)
        {
            LogEntry log = new LogEntry("GetGPXforRoute ", routeID.ToString());

            string data = "";
            if (gpxConnection.IsConnect())
            {

                try
                {
                    string query = string.Format("SELECT route FROM routes where id={0}", routeID);

                    using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataRoutes = new DataTable();
                        routeAdapter.Fill(dataRoutes);
                        int length = dataRoutes.Rows.Count;
                        for (int row = 0; row < length; row++)
                        {

                            try
                            {
                                DataRow dr = dataRoutes.Rows[row];
                                try { data = (string)dr["route"]; } catch { }
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
            log.Result = "got gpx data for " + routeID;
            log.Save(gpxConnection);
            gpxConnection.Close();
            return data;
        }

        // update with distance extracted from GPX file
        public string UpdateRoute(Route route)
        {
            LogEntry log = new LogEntry("UpdateRoute ", route.ID.ToString());

            int successRows = 0;
            string result = "";
            if (gpxConnection.IsConnect())
            {
                try
                {

                    using (System.Net.WebClient client = new System.Net.WebClient())
                    {

                        string query = string.Format("update routes set distance = {0} where id = {1}", route.Distance, route.ID);

                        using (MySqlCommand command = new MySqlCommand(query, gpxConnection.Connection))
                        {
                            successRows = command.ExecuteNonQuery();

                        }
                        result = "OK";
                    }


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
            return result;
        }
        public string DeleteRoute(int routeID)
        {
            LogEntry log = new LogEntry("DeleteRoute ", routeID.ToString());

            int successRows = 0;
            string result = "";
            if (gpxConnection.IsConnect())
            {
                try
                {
                    // first check that there are no future rides connected with this route
                    // convert to our app date type
                    DateTime today = DateTime.Now;
                    DateTime jan1970 = new DateTime(1970, 1, 1);
                    TimeSpan appSpan = today - jan1970;
                    int appdays = appSpan.Days;

                    string query = string.Format("SELECT rideID,date FROM rides where routeID = '{0}' and date > '{1}'", routeID, appdays);
                    int count = 0;

                    string now = Logdata.TimeString(DateTime.Now);
                    using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataRoutes = new DataTable();
                        routeAdapter.Fill(dataRoutes);
                        count = dataRoutes.Rows.Count;
                        if (count > 0)
                        {
                            DataRow dr = dataRoutes.Rows[0];
                            appdays = (int)dr["date"];
                        }
                    }
                    if (count > 0)
                    {
                        // convert app days back to c# date
                        TimeSpan days = new TimeSpan(appdays, 0, 0, 0);
                        DateTime when = jan1970 + days;
                        result = string.Format("There is at least one ride using this route in the future, on {0}. Please delete the ride first (if there are no riders signed up for it)", when.ToShortDateString());
                    }
                    else
                    {
                        using (System.Net.WebClient client = new System.Net.WebClient())
                        {
                            query = string.Format("delete from routes where id = {0}", routeID);
                            using (MySqlCommand command = new MySqlCommand(query, gpxConnection.Connection))
                            {
                                successRows = command.ExecuteNonQuery();
                            }
                            result = "OK";
                        }
                    }
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
            return result;
        }


    }
}
