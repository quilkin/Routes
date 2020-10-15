using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.ServiceModel;
using System.ServiceModel.Channels;
using System.Data;
//using System.Data.SqlClient;
using MySql.Data;
using MySql.Data.MySqlClient;
using System.Diagnostics;
using System.Configuration;
using System.Web.Script.Serialization;
using System.Xml;

namespace Routes
{
    public class EmailConnection
    {
        public string Server { get { return Connections.emailServer; } }
        public string User { get { return Connections.emailUserName; } }
        public string PW { get { return Connections.emailPassword; } }
    }


    public class DBConnection
    {
        private const string server = Connections.server;
        private const string dbName = Connections.dbName;
        private const string user = Connections.user;
        private const string pw = Connections.pw;

        private DBConnection()
        {
        }


        public string Password { get; set; }
        private MySqlConnection connection = null;
        public MySqlConnection Connection
        {
            get { return connection; }
        }

        private static DBConnection _instance = null;
        public static DBConnection Instance()
        {
            if (_instance == null)
                _instance = new DBConnection();
            return _instance;
        }

        public bool IsConnect()
        {
            if (Connection == null)
            {
                if (String.IsNullOrEmpty(dbName))
                    return false;
                string connstring = string.Format("Server={0}; port=3306; database={1}; UID={2}; password={3}", server,dbName,user,pw);
                connection = new MySqlConnection(connstring);
                connection.Open();
            }
            else if (connection.State == System.Data.ConnectionState.Closed) { connection.Open(); }

            return true;
        }

    
        public void Close()
        {
            connection.Close();
        }
    }

    // NOTE: You can use the "Rename" command on the "Refactor" menu to change the class name "Service1" in code, svc and config file together.
    // NOTE: In order to launch WCF Test Client for testing this service, please select Service1.svc or Service1.svc.cs at the Solution Explorer and start debugging.
    public class Routes : IRoutes, IDisposable
    {

  
        DBConnection gpxConnection = DBConnection.Instance();

        DataTable dataRoutes;
        //List<Logdata> logdata;
        List<Route> routes;
        List<Ride> rides;
        //List<Location> locations;
        DataTable dataLogins;
        //int currentID;




        public static string TimeString(DateTime time)
        {
            if (time == DateTime.MinValue)
                return System.DBNull.Value.ToString();
            return string.Format("{0}{1}{2} {3}:{4}:{5}",
                time.Year, time.Month.ToString("00"), time.Day.ToString("00"),
                time.Hour.ToString("00"),time.Minute.ToString("00"),time.Second.ToString("00"));
        }

        public Routes()
        {
        }
        public void Dispose()
        {
            //if (dataLogs != null)
            //    dataLogs.Dispose();
            if (dataLogins != null)
                dataLogins.Dispose();
            if (gpxConnection != null)
                gpxConnection.Close();
        }

        private string GetIP()
        {
            OperationContext oOperationContext = OperationContext.Current;
            MessageProperties oMessageProperties = oOperationContext.IncomingMessageProperties;
            RemoteEndpointMessageProperty oRemoteEndpointMessageProperty = (RemoteEndpointMessageProperty)oMessageProperties[RemoteEndpointMessageProperty.Name];

            string szAddress = oRemoteEndpointMessageProperty.Address;
            int nPort = oRemoteEndpointMessageProperty.Port;
            return szAddress;
        }

        public string TestService()
        {
            return "Service found and working!";
        }

        /// <summary>
        /// Log in to the system
        /// </summary>
        /// <param name="login">login object with just a username and password</param>
        /// <returns>login object with details of role and user id</returns>
        public Login Login(Login login)
        {
            LogEntry log = new LogEntry(GetIP(), "Login", login.Name + " " +login.PW);


            string query = "SELECT Id, name, pw, email, role FROM logins";
            if (gpxConnection.IsConnect())
            {
                using (MySqlDataAdapter loginAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                {
                    dataLogins = new DataTable();
                    loginAdapter.Fill(dataLogins);

                    int length = dataLogins.Rows.Count;
                    for (int row = 0; row < length; row++)
                    {
                        DataRow dr = dataLogins.Rows[row];
                        string dbname = (string)dr["name"];
                        dbname = dbname.Trim();
                        string dbpw = (string)dr["pw"];
                        dbpw = dbpw.Trim();
                        if (dbname == login.Name && dbpw == login.PW)
                        {
                            login.Role = (int)dr["role"];
                            login.ID = (int)dr["id"];
                            break;
                        }
                    }
                }
                log.Result = login.Name;
                log.Save(gpxConnection);
                gpxConnection.Close();
                return login;
            }
            return null;
        }

        public string Register(Login login)
        {
            LogEntry log = new LogEntry(GetIP(), "Register", login.Name + " " + login.Code);
            string result = "";
            if (login.Code == login.CalcCode())
            {
                string query = string.Format("update logins set role = 1 where name = '{0}'",
                    login.Name);
                if (gpxConnection.IsConnect())
                {
                    try
                    {
                        var cmd = new MySqlCommand(query, gpxConnection.Connection);
                        cmd.ExecuteNonQuery();
                        result = "Thank you, you have now registered";
                    }
                    catch (Exception ex)
                    {
                        result = result = "There is a database error, please try again:" + ex.Message;
                    }
                }
                log.Result = login.Name;
                log.Save(gpxConnection);
                gpxConnection.Close();
                return result;
            }
            return "Error with email or code, sorry";
        }
           

        public string Signup(Login login)
        {
            LogEntry log = new LogEntry(GetIP(), "Signup",  new JavaScriptSerializer().Serialize(login));


            System.Net.Mail.MailAddress emailAddr;
            string result = "OK, now please wait for an email and click the link to complete your registration";
            try
            {
                emailAddr = new System.Net.Mail.MailAddress(login.Email);
                // Valid address
            }
            catch
            {
                return("This email address appears to be invalid");
            }
            if (login.PW.Length < 4 || login.PW.Length > 10)
                return ("Password must be between 4 and 10 characters");

            string query = "SELECT Id, name, pw, email FROM logins";
            if (gpxConnection.IsConnect())
            {
                if (login.Code == 0)
                // not yet confirmed the signup
                {
                    using (MySqlDataAdapter loginAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataLogins = new DataTable();
                        loginAdapter.Fill(dataLogins);

                        int length = dataLogins.Rows.Count;
                        for (int row = 0; row < length; row++)
                        {
                            DataRow dr = dataLogins.Rows[row];
                            string dbname = (string)dr["name"];
                            dbname = dbname.Trim();
                            string dbpw = (string)dr["pw"];
                            dbpw = dbpw.Trim();
                            if (dbname == login.Name)
                            {
                                result = "Sorry, this username has already been taken";
                                break;
                            }
                        }
                    }
                }


                if (login.Code == 0)
                // not yet confirmed the signup
                {
                    // create a code based on data
                    login.Code = login.CalcCode();
                    string[] emailparts = emailAddr.Address.Split(new Char[] { '@' });

                    string URLstr = string.Format("https://quilkin.co.uk/tccrides?username={0}&regcode={1}&m1={2}&m2={3}",
                        login.Name, login.Code, emailparts[0], emailparts[1]);
                    //string URLstr = string.Format("https://quilkin.co.uk/tccrides?username={0}&regcode={1}", login.Name, login.Code);
                    EmailConnection email = new EmailConnection();
                    System.Net.Mail.MailAddress from = new System.Net.Mail.MailAddress("admin@quilkin.co.uk");
                    System.Net.Mail.MailMessage message = new System.Net.Mail.MailMessage(from, emailAddr);
                    message.Subject = "TCC rides signup";
                    message.Body = string.Format("Please click {0}  to complete your registration", URLstr);

                    try
                    {
                        System.Net.Mail.SmtpClient client = new System.Net.Mail.SmtpClient(email.Server);
                        //client.Credentials = System.Net.CredentialCache.DefaultNetworkCredentials;
                        client.Credentials = new System.Net.NetworkCredential(email.User, email.PW);
                        client.Send(message);

                        // save the login details but with role as zero so login won't yet work
                        log = new LogEntry(GetIP(), "Register", login.Name + " " + login.Code);
                        query = string.Format("insert into logins (name, pw, email,role) values ('{0}','{1}','{2}',{3})", login.Name, login.PW, login.Email, 0);

                        try
                        {
                            var cmd = new MySqlCommand(query, gpxConnection.Connection);
                            cmd.ExecuteNonQuery();
                            result = "Thank you, please wait for an email and click link to complete registration";
                        }
                        catch (Exception ex2)
                        {
                            result = "There is a database error, please try again:" + ex2.Message;  ;
                        }
                    }
                    catch (Exception ex)
                    {
                        result = "Sorry, there is an error with the email service: " + ex.Message;
                    }



                 }
                log.Result = result;
                log.Save(gpxConnection);

                gpxConnection.Close();

                return result;
            }
            else

                return "No DB Connecton";

        }

        public string SaveRoute(Route route)
        {
            LogEntry log = new LogEntry(GetIP(), "SaveRoute", route.ID + " " + route.Dest);

            //int successRows = 0;
            string result = "";
            if (gpxConnection.IsConnect())
            {
                try
                {
                    // check route of same name isn't already there***************

                    string query = string.Format("SELECT dest FROM routes where dest = '{0}'", route.Dest);
                    bool exists = true;
                    string now = TimeString(DateTime.Now);
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
                        result = "This route destination already exists. Please choose another name: add -a or -b ?";
                    }

                    else
                    {
                        // fetch the text from the URL
                        string fullText;
                        try
                        {
                            using (System.Net.WebClient client = new System.Net.WebClient())
                            {
                                if (route.URL == "none")
                                {
                                    fullText = route.URL;
                                } else { 
                                    fullText = client.DownloadString(route.URL);

                                    XmlDocument xmldoc = new XmlDocument();
                                    // will catch if not valid XML
                                    xmldoc.LoadXml(fullText);
                                }


                                query = string.Format("insert into routes (dest,distance,description,climbing,route,owner) values ('{0}','{1}','{2}','{3}','{4}','{5}')",
                                    route.Dest, route.Distance, route.Descrip, route.Climbing, fullText, route.Owner);
                                query += "; SELECT CAST(LAST_INSERT_ID() AS int)";
                                object routeID = null;

                                using (MySqlCommand command = new MySqlCommand(query, gpxConnection.Connection))
                                {
                                    //successRows = command.ExecuteNonQuery();
                                    routeID = command.ExecuteScalar();
                                }
                                //if (successRows == 1)
                                //{
                                    // return id of new route
                                    result = routeID.ToString();
                                //}
                                //else
                                //    result = string.Format("Database error: route \"{0}\" not saved", route.Dest);
                            }
                        }
                        catch (Exception ex2)
                        {
                            result = string.Format("Database error: route \"{0}\" not saved: {1}", route.Dest, ex2.Message);
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

        public string SaveRide(Ride ride)
        {
            LogEntry log = new LogEntry(GetIP(), "SaveRide", ride.Date + " " + ride.Dest);

            //int successRows = 0;
            string result = "";
            if (gpxConnection.IsConnect())
            {
                try
                {
                    // check ride with same leader and date isn't already there ***************

                    string query = string.Format("SELECT dest FROM rides where date= '{0}' and leaderName = '{1}'", ride.Date, ride.LeaderName);
                    bool exists = true;
                    string now = TimeString(DateTime.Now);
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
                        result = "There is already a ride with you as leader on the same date. Please choose another date.";
                    }

                    else
                    {

                        using (System.Net.WebClient client = new System.Net.WebClient())
                        {

                            query = string.Format("insert into rides (dest,leaderName,date,time,meetingAt) values ('{0}','{1}','{2}','{3}','{4}')",
                                ride.Dest, ride.LeaderName, ride.Date, ride.Time, ride.MeetAt);
                            // get new ride ID
                            query += "; SELECT CAST(LAST_INSERT_ID() AS int)";
                            object rideID = null;

                            using (MySqlCommand command = new MySqlCommand(query, gpxConnection.Connection))
                            {
                                // successRows = command.ExecuteNonQuery();
                                rideID = command.ExecuteScalar();
                            }
                            // return id of new route
                            result = rideID.ToString();
                        }
                    }
                }
                catch (Exception ex)
                {
                    result = string.Format("Database error: ride \"{0}\" not saved: {1}", ride.Dest,  ex.Message);
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
            LogEntry log = new LogEntry(GetIP(), "GetRouteSummaries", "");

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
                            string dest = "", descrip="";
                            int id, owner=0, climbing = 0, distance = 0;
                            try
                            {
                                DataRow dr = dataRoutes.Rows[row];
                                id = (int)dr["id"];
                                try { dest = (string)dr["dest"]; } catch { }
                                try { descrip = (string)dr["description"]; } catch { }
                                try { climbing= (int)dr["climbing"]; } catch { }
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

        public IEnumerable<Ride> GetRidesForDate(int date)
        {
            // get details of routes available for a given date (but not yet the GPX data)
            // date represented by days since 01/01/1970
            LogEntry log = new LogEntry(GetIP(), "GetRidesForDate", Logdata.JSDateToDateTime(date).ToShortDateString());

            rides = new List<Ride>();

            if (gpxConnection.IsConnect())
            {
                try
                {
                    string query = string.Format("SELECT rideID,dest,date,time,meetingAt,leaderName FROM rides where date= {0}",date);

                    using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataRoutes = new DataTable();
                        routeAdapter.Fill(dataRoutes);
                        int length = dataRoutes.Rows.Count;
                        for (int row = 0; row < length; row++)
                        {
                            string dest = "", meet = "", leader = "";
                            int time = 0, id;
                            try
                            {
                                DataRow dr = dataRoutes.Rows[row];
                                id = (int)dr["rideID"];
                                try { dest = (string)dr["dest"]; } catch { }
                                try { meet = (string)dr["meetingAt"]; } catch { }
                                try { date = (int)dr["date"]; } catch { }
                                try { time = (int)dr["time"]; } catch { }
                                try { leader = (string)dr["leadername"]; } catch { }

                                rides.Add(new Ride(dest, leader, id, date, time, meet));
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
            log.Result = rides.Count.ToString() + " rides for " + Logdata.JSDateToDateTime(date).ToShortDateString();
            log.Save(gpxConnection);
            gpxConnection.Close();
            return rides;
        }
        public string GetGPXforRoute(int routeID)
        {
            LogEntry log = new LogEntry(GetIP(), "GetGPXforRoute ", routeID.ToString());

            string data = "";
            if (gpxConnection.IsConnect())
            {

                try
                {
                    string query = string.Format("SELECT route FROM routes where id={0}",routeID);

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
                                try { data= (string)dr["route"]; } catch { }
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

        // need to get list of participants for all shown rides at once, to avoid javascript running forward to next requests
        public string[] GetParticipants(int[] rideIDs)
        {
            LogEntry log = new LogEntry(GetIP(), "GetParticipants for rides: " , rideIDs.Length.ToString() );


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
            }
            log.Result = "got Participants for " + rideIDs.Length + "rides";
            log.Save(gpxConnection);
            gpxConnection.Close();
            return participants;
        }

        public string SaveParticipant(Participant pp)
        {
            LogEntry log = new LogEntry(GetIP(), "SaveParticipant", pp.Rider + " " + pp.rideID);

            int successRows = 0;
            string result = "";
            if (gpxConnection.IsConnect())
            {
                try
                {
                    // check this isn't already there ***************

                    string query = string.Format("SELECT rider FROM Participants where rideID = '{0}' and rider = '{1}'", pp.rideID, pp.Rider );
                    bool exists = true;
                    string now = TimeString(DateTime.Now);
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
                        // now check that there aren't too many riders

                        // ToDo: this next bit should be done globally, not every time a rider is added
                        int maxriders = 6;
                        query = string.Format("SELECT maxriders FROM settings");
                        using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                        {
                            dataRoutes = new DataTable();
                            routeAdapter.Fill(dataRoutes);
                            DataRow dr = dataRoutes.Rows[0];
                            maxriders = (int)dr["maxriders"];
                        }
                        query = string.Format("SELECT rider FROM Participants where rideID = '{0}' ", pp.rideID);
                        using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                        {
                            dataRoutes = new DataTable();
                            routeAdapter.Fill(dataRoutes);

                            int length = dataRoutes.Rows.Count;
                            if (length >= maxriders - 1)
                            {
                                result = string.Format("Already {0} riders in this ride, including the leader. Sorry! If you turn up, though, there may be a cancellation :)", maxriders);
                            }
                            else
                            {
                                // todo: this string is now redundant
                                string riders = "*";
                                for (int row = 0; row < length; row++)
                                {
                                    DataRow dr = dataRoutes.Rows[row];
                                    riders = riders + (string)dr["rider"] + " ";
                                }
                                using (System.Net.WebClient client = new System.Net.WebClient())
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

        public string LeaveParticipant(Participant pp)
        {
            LogEntry log = new LogEntry(GetIP(), "LeaveParticipant", pp.Rider + " " + pp.rideID);

            int successRows = 0;
            string result = "";
            if (gpxConnection.IsConnect())
            {
                try
                {
                    // check this is already there ***************

                    string query = string.Format("SELECT rider FROM Participants where rideID = '{0}' and rider = '{1}'", pp.rideID, pp.Rider);
                    bool exists = true;
                    string now = TimeString(DateTime.Now);
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

                                using (System.Net.WebClient client = new System.Net.WebClient())
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

        // update with distance extracted from GPX file
        public string UpdateRoute(Route route)
        {
            LogEntry log = new LogEntry(GetIP(), "UpdateRoute ", route.ID.ToString());

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

        public string DeleteRide(int rideID)
        {
            LogEntry log = new LogEntry(GetIP(), "DeleteRide ", rideID.ToString());

            int successRows = 0;
            string result = "";
            if (gpxConnection.IsConnect())
            {
                try
                {

                        using (System.Net.WebClient client = new System.Net.WebClient())
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
