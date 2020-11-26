using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;
using System.Diagnostics;
using System.Runtime.Serialization;

namespace Routes
{



    [DataContract]
    public class Ride
    {
        //[DataMember(Name = "dest")]
        //public string Dest { get; set; }


        [DataMember(Name = "rideID")]
        public int ID { get; set; }

        [DataMember(Name = "routeID")]
        public int routeID { get; set; }

        [DataMember(Name = "leaderName")]
        public string LeaderName { get; set; }

        [DataMember(Name = "date")]
        public int Date { get; set; }

        [DataMember(Name = "time")]
        public int Time { get; set; }

        [DataMember(Name = "meetingAt")]
        public string MeetAt { get; set; }

        public Ride(int r_ID, string lead, int id, int date, int time, string meet)
        {
            routeID = r_ID;
            LeaderName = lead;
            Date = date;
            Time = time;
            MeetAt = meet;
            ID = id;
        }

    }

    [DataContract]
    public class Participant
    {
        [DataMember(Name = "rider")]
        public string Rider { get; set; }
        [DataMember(Name = "rideID")]
        public int rideID { get; set; }


        public Participant(string rider, int id)
        {
            Rider = rider;
            rideID = id;
        }

    }



    public partial class Routes : IRoutes, IDisposable
    {
       
        public string SaveRide(Ride ride)
        {
            // ride.MeetAt = ride.MeetAt.Replace("'", "''");

            GetRidOfApostrophes(ride.MeetAt);

            LogEntry log = new LogEntry("SaveRide", ride.Date + " " + ride.routeID);

            //int successRows = 0;
            string result = "";
            if (gpxConnection.IsConnect())
            {
                try
                {
                    // check ride with same leader and date isn't already there ***************

                    string query = string.Format("SELECT dest FROM rides where date= '{0}' and leaderName = '{1}'", ride.Date, ride.LeaderName);
                    bool exists = true;
                    string now = Logdata.TimeString(DateTime.Now);
                    string rideDest = "";
                    using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataRoutes = new DataTable();
                        routeAdapter.Fill(dataRoutes);

                        if (dataRoutes.Rows.Count == 0)
                        {
                            exists = false;
                        }
                        else
                        {
                            DataRow dr = dataRoutes.Rows[0];
                            try { rideDest = (string)dr["dest"]; } catch { }
                        }
                    }
                    if (exists)
                    {
                        result = string.Format("There is already a ride with you as leader on the same date. Please choose another date.");
                    }

                    else
                    {

                        //using (System.Net.WebClient client = new System.Net.WebClient())
                        {

                            query = string.Format("insert into rides (routeID,leaderName,date,time,meetingAt) values ('{0}','{1}','{2}','{3}','{4}')",
                                ride.routeID, ride.LeaderName, ride.Date, ride.Time, ride.MeetAt);
                            // get new ride ID
                            query += "; SELECT CAST(LAST_INSERT_ID() AS int)";
                            object rideID = null;

                            using (MySqlCommand command = new MySqlCommand(query, gpxConnection.Connection))
                            {
                                rideID = command.ExecuteScalar();
                            }
                            // return id of new route
                            result = rideID.ToString();
                        }
                        //}
                    }
                }
                catch (Exception ex)
                {
                    result = string.Format("Database error: ride \"{0}\" not saved: {1}", ride.ID, ex.Message);
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



        public IEnumerable<Ride> GetRidesForDate(int date)
        {
            // get details of routes available for a given date (but not yet the GPX data)
            // date represented by days since 01/01/1970
            LogEntry log = new LogEntry("GetRidesForDate", Logdata.JSDateToDateTime(date).ToShortDateString());

            List<Ride>  rides = new List<Ride>();

            if (gpxConnection.IsConnect())
            {
                try
                {
                    string query = string.Format("SELECT rideID,routeID,date,time,meetingAt,leaderName FROM rides where date= {0}", date);

                    using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataRoutes = new DataTable();
                        routeAdapter.Fill(dataRoutes);
                        int length = dataRoutes.Rows.Count;
                        for (int row = 0; row < length; row++)
                        {
                            string meet = "", leader = "";
                            int time = 0, id, routeID = 0;
                            try
                            {
                                DataRow dr = dataRoutes.Rows[row];
                                id = (int)dr["rideID"];
                                try { routeID = (int)dr["routeID"]; } catch { }
                                try { meet = (string)dr["meetingAt"]; } catch { }
                                try { date = (int)dr["date"]; } catch { }
                                try { time = (int)dr["time"]; } catch { }
                                try { leader = (string)dr["leadername"]; } catch { }

                                rides.Add(new Ride(routeID, leader, id, date, time, meet));
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
                    log.Result = rides.Count.ToString() + " rides for " + Logdata.JSDateToDateTime(date).ToShortDateString();
                    log.Save(gpxConnection);
                    gpxConnection.Close();
                }
            }

            return rides;
        }

        public IEnumerable<Ride> GetRecentRides()
        {
            // get a list of all dates (in future or recent past) that have rides attached
            // date represented by days since 01/01/1970
            LogEntry log = new LogEntry("GetDatesWithRides", "");

            List<Ride> rides = new List<Ride>();

            // get JS date for a month ago
            int appdays = Logdata.NowtoJSDate() - 31;

            if (gpxConnection.IsConnect())
            {
                try
                {
                    string query = string.Format("SELECT date,leaderName,routeID FROM rides where date > {0}", appdays);

                    using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataRoutes = new DataTable();
                        routeAdapter.Fill(dataRoutes);
                        int length = dataRoutes.Rows.Count;
                        for (int row = 0; row < length; row++)
                        {
                            string leader = "";
                            int routeID = 0, date = 0;
                            try
                            {
                                DataRow dr = dataRoutes.Rows[row];
                                routeID = (int)dr["routeID"];
                                try { date = (int)dr["date"]; } catch { }
                                try { leader = (string)dr["leadername"]; } catch { }
                                //DateTime dt = Logdata.JSDateToDateTime(date);
                                rides.Add(new Ride(routeID, leader, 0, date, 0, ""));
                                //dates.Add(date);
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

                    log.Result = rides.Count.ToString() + " future and recent rides found ";
                    log.Save(gpxConnection);
                    gpxConnection.Close();
                }
            }
            return rides;
        }

        //  get list of participants for all shown rides at once
        public string[] GetParticipants(int[] rideIDs)
        {
            LogEntry log = new LogEntry("GetParticipants for rides: ", rideIDs.Length.ToString());


            string[] participants = new string[rideIDs.Length];
            int index = 0;
            if (gpxConnection.IsConnect())
            {
                try
                {
                    foreach (int rideID in rideIDs)
                    {
                        string pp = ",";
                        string query = string.Format("SELECT rider FROM Participants where rideID = '{0}' ", rideID);
                        using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                        {
                            dataRoutes = new DataTable();
                            routeAdapter.Fill(dataRoutes);
                            int length = dataRoutes.Rows.Count;

                            for (int row = 0; row < length; row++)
                            {
                                DataRow dr = dataRoutes.Rows[row];
                                pp = pp + (string)dr["rider"] + ",";
                            }

                        }
                        participants[index++] = pp;

                    }
                }
                catch (Exception ex2)
                {
                    Trace.WriteLine(ex2.Message);
                    log.Error = ex2.Message;
                }
                finally
                {

                    log.Result = "got Participants for " + rideIDs.Length + "rides";
                    log.Save(gpxConnection);
                    gpxConnection.Close();
                }
            }
            return participants;
        }

        public string SaveParticipant(Participant pp)
        {
            LogEntry log = new LogEntry("SaveParticipant", pp.Rider + " " + pp.rideID);

            int successRows = 0;
            string result = "";
            if (gpxConnection.IsConnect())
            {
                try
                {
                    // check this isn't already there ***************

                    string query = string.Format("SELECT rider FROM Participants where rideID = '{0}' and rider = '{1}'", pp.rideID, pp.Rider);
                    bool exists = true;
                    string now = Logdata.TimeString(DateTime.Now);
                    using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataRoutes = new DataTable();
                        routeAdapter.Fill(dataRoutes);

                        if (dataRoutes.Rows.Count == 0)
                        {
                            exists = false;
                        }
                    }
                    if (exists)
                    {
                        result = "You are aleady booked onto this ride. Please choose another ride";
                    }
                    else
                    {

                        // todo: this string is now redundant
                        string riders = "*";

                        //using (System.Net.WebClient client = new System.Net.WebClient())
                        {

                            query = string.Format("insert into Participants (rider, rideID) values ('{0}','{1}')", pp.Rider, pp.rideID);

                            using (MySqlCommand command = new MySqlCommand(query, gpxConnection.Connection))
                            {
                                successRows = command.ExecuteNonQuery();

                            }
                            result = riders;
                        }

                    }
                }
                catch (Exception ex)
                {
                    result = string.Format("Database error: {0}", ex.Message);
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

        public string LeaveParticipant(Participant pp)
        {
            LogEntry log = new LogEntry("LeaveParticipant", pp.Rider + " " + pp.rideID);

            int successRows = 0;
            string result = "";
            if (gpxConnection.IsConnect())
            {
                try
                {
                    // check this is already there ***************

                    string query = string.Format("SELECT rider FROM Participants where rideID = '{0}' and rider = '{1}'", pp.rideID, pp.Rider);
                    bool exists = true;
                    string now = Logdata.TimeString(DateTime.Now);
                    using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataRoutes = new DataTable();
                        routeAdapter.Fill(dataRoutes);

                        if (dataRoutes.Rows.Count == 0)
                        {
                            exists = false;
                        }
                    }
                    if (exists == false)
                    {
                        result = "Error: You are not booked onto this ride.";
                    }
                    else
                    {
                        //using (System.Net.WebClient client = new System.Net.WebClient())
                        {

                            query = string.Format("delete from Participants where rider = '{0}'and rideID = {1}", pp.Rider, pp.rideID);

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

        public string DeleteRide(int rideID)
        {
            LogEntry log = new LogEntry("DeleteRide ", rideID.ToString());

            int successRows = 0;
            string result = "";
            if (gpxConnection.IsConnect())
            {
                try
                {
                    //using (System.Net.WebClient client = new System.Net.WebClient())
                    {
                        string query = string.Format("delete from rides where rideID = {0}", rideID);
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


    }
}