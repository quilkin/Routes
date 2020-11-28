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
        public string Owner { get; set; }
        [DataMember(Name = "id")]
        public int ID { get; set; }
        [DataMember(Name = "hasGPX")]
        public bool HasGPX { get; set; }


        public Route(bool hasGPX, string url, string dest, string descrip, int d, int climb, string ow, int id)
        {
            URL = url;
            Dest = dest;
            Descrip = descrip;
            Distance = d;
            Climbing = climb;
            Owner = ow;
            ID = id;
            HasGPX = hasGPX;
            //if (url != null)
            //    HasGPX = (url.Length > 0);

        }

    }

    public partial class Routes : IRoutes, IDisposable
    {

        DBConnection gpxConnection = DBConnection.Instance();

        DataTable dataRoutes;
        List<Route> routes;
       // List<Ride> rides;
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

        static string GetRidOfApostrophes(string data)
        {
            return data.Replace("'", "''");
        }

        public string TestService()
        {
            return "Service found and working!";
        }


        public string SaveRoute(Route route)
        {
            route.Dest = GetRidOfApostrophes(route.Dest);
            route.Descrip = GetRidOfApostrophes(route.Descrip);

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
                        System.Net.ServicePointManager.SecurityProtocol |= System.Net.SecurityProtocolType.Tls12;
                        //using (System.Net.WebClient client = new System.Net.WebClient())
                        {
                            if (route.HasGPX == false || route.URL.Length > 1000)
                            {
                                // either no GPX available, or full GPX has been uploaded
                                if (route.URL.Contains("TrainingCenterDatabase"))
                                {
                                    // full text of TCX file
                                    System.IO.StringReader sr = new System.IO.StringReader(route.URL);
                                    // convert TCX to GPX
                                    GarminTrack.SetRoot(sr);
                                    fullText = GarminTrack.CreateGPX();
                                }
                                else
                                {

                                    fullText = route.URL;
                                }
                            }

                            else if (route.URL.ToLower().Contains(".tcx"))
                            {
                                // convert TCX to GPX
                                GarminTrack.SetRoot(route.URL);
                                fullText = GarminTrack.CreateGPX();
                            }
                            else
                            {
                                using (System.Net.WebClient client = new System.Net.WebClient())
                                {
                                      fullText = client.DownloadString(route.URL);
                                }
                            }

                            if (route.HasGPX)
                            {
                                XmlDocument xmldoc = new XmlDocument();
                                // will catch if not valid XML
                                xmldoc.LoadXml(fullText);
                            }

                            string query = string.Format("insert into routes (dest,distance,description,climbing,route,ownername,hasGPX) values ('{0}','{1}','{2}','{3}','{4}','{5}',{6})",
                                route.Dest, route.Distance, route.Descrip, route.Climbing, fullText, route.Owner, route.HasGPX? 1:0);
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
                    catch (XmlException exXml)
                    {
                        result = string.Format("XML parse error: route \"{0}\" not saved: {1}", route.Dest, exXml.Message);
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
            else
                return DBConnection.ErrStr;
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
                    string query = string.Format("SELECT hasGPX,id,dest,description,distance,climbing,ownername FROM routes ");

                    using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataRoutes = new DataTable();
                        routeAdapter.Fill(dataRoutes);
                        int length = dataRoutes.Rows.Count;
                        for (int row = 0; row < length; row++)
                        {
                            string dest = "", descrip = "", owner = "";
                            int id,  climbing = 0, distance = 0;
                            bool hasGPX = false;
                            try
                            {
                                DataRow dr = dataRoutes.Rows[row];
                                id = (int)dr["id"];
                                dest = (string)dr["dest"]; 
                                descrip = (string)dr["description"]; 
                                climbing = (int)dr["climbing"]; 
                                distance = (int)dr["distance"]; 
                                owner = (string)dr["ownername"]; 
                                Int32 h = Convert.ToInt32(dr["hasGPX"]);
                                    hasGPX = (h > 0); 

                                routes.Add(new Route(hasGPX, null, dest, descrip, distance, climbing, owner, id));
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
                    log.Result = routes.Count.ToString() + " routes altogether";
                    log.Save(gpxConnection);
                    gpxConnection.Close();
                }
            }
            //else
            //    return DBConnection.ErrStr;

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

                finally
                {
                    log.Result = "got gpx data for " + routeID;
                    log.Save(gpxConnection);
                    gpxConnection.Close();
                }
            }
            return data;
        }

        // update with distance, climbing and name extracted from GPX file
        public string UpdateRoute(Route route)
        {
            route.Dest = GetRidOfApostrophes(route.Dest);
            route.Descrip = GetRidOfApostrophes(route.Descrip);

            LogEntry log = new LogEntry("UpdateRoute ", route.ID.ToString());

            int successRows = 0;
            string result = "";
            if (gpxConnection.IsConnect())
            {
                try
                {
                        string query = string.Format("update routes set distance = {0}, climbing = {1}, dest = '{2}' where id = {3}", 
                            route.Distance, route.Climbing, route.Dest, route.ID);

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

        // change destination or description
        public string EditRoute(Route route)
        {
            route.Dest = GetRidOfApostrophes(route.Dest);
            route.Descrip = GetRidOfApostrophes(route.Descrip);

            LogEntry log = new LogEntry("EditRoute", route.ID + " " + route.Dest);

            string result = "";
            if (gpxConnection.IsConnect())
            {

                try
                {
                    //using (System.Net.WebClient client = new System.Net.WebClient())
                    {


                        string query = string.Format("update routes set dest = '{0}', description = '{1}' where id = {2}", route.Dest, route.Descrip, route.ID);

                        using (MySqlCommand command = new MySqlCommand(query, gpxConnection.Connection))
                        {
                            command.ExecuteNonQuery();

                        }
                        result = "OK";
                    }
                }
                catch (Exception ex2)
                {
                    result = string.Format("Database error: route \"{0}\" not saved: {1}", route.Dest, ex2.Message);
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
                    int appdays = Logdata.NowtoJSDate();
                    //DateTime today = DateTime.Now;
                    DateTime jan1970 = new DateTime(1970, 1, 1);
                    //TimeSpan appSpan = today - jan1970;
                    //int appdays = appSpan.Days;

                    string query = string.Format("SELECT rideID,date FROM rides where routeID = {0} and date > {1}", routeID, appdays);
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
                        
                        //TimeSpan days = new TimeSpan(appdays, 0, 0, 0);
                        //DateTime when = jan1970 + days;
                        DateTime when = Logdata.JSDateToDateTime(appdays);
                        result = string.Format("There is at least one ride using this route in the future, on {0}. Please delete the ride first (if there are no riders signed up for it)", when.ToShortDateString());
                    }
                    else
                    {
                        //using (System.Net.WebClient client = new System.Net.WebClient())
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
            else
                return DBConnection.ErrStr;

            return result;
        }


    }
}
