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

        public string Signup(Login login)
        {
            LogEntry log = new LogEntry(GetIP(), "Signup",  new JavaScriptSerializer().Serialize(login));


            System.Net.Mail.MailAddress emailAddr;
            string result = "OK, now please enter code from email and resubmit details";
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
                else if (login.Code == login.CalcCode())
                {
                    query = string.Format("insert into logins (name, pw, email) values ('{0}','{1}','{2}',)\n\r",
                        login.Name, login.PW, login.Email);
                    try
                    {
                        var cmd = new MySqlCommand(query, gpxConnection.Connection) ;
                        cmd.ExecuteNonQuery();
                        result = "Thank you, you have now registered";
                    }
                    catch
                    {
                        result = "There is a database error, please try again";
                    }
                }
                else
                {
                    result = "There is an error with the code number, please try again";
                }



                if (login.Code == 0)
                // not yet confirmed the signup
                {
                    // create a code based on data
                    login.Code = login.CalcCode();

                    EmailConnection email = new EmailConnection();
                    System.Net.Mail.MailAddress from = new System.Net.Mail.MailAddress("admin@quilkin.co.uk");
                    System.Net.Mail.MailMessage message = new System.Net.Mail.MailMessage(from, emailAddr);
                    message.Subject = "BLE log signup";
                    message.Body = string.Format("Please enter the code {0} into the signup page to complete your registration", login.Code);

                    try
                    {
                        System.Net.Mail.SmtpClient client = new System.Net.Mail.SmtpClient(email.Server);
                        //client.Credentials = System.Net.CredentialCache.DefaultNetworkCredentials;
                        client.Credentials = new System.Net.NetworkCredential(email.User, email.PW);
                        client.Send(message);
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

            int successRows = 0;
            string result = "";
            if (gpxConnection.IsConnect())
            {
                try
                {
                    // check route of same name isn't already there***************

                    string query = string.Format("SELECT dest FROM routes where routes.dest = '{0}'", route.Dest);
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
                        result = "This route destination already exists. Please choose another name: add '-a' or '-b'?";
                    }

                    else
                    {
                        query = string.Format("insert into routes (dest,distance,descrip,climbing,route,owner,place, date, time) values ('{0}','{1}','{2}','{3}','{4}','{5}','{6}','{7}','{8}')",
                            route.Dest, route.Distance, route.Descrip, route.Climbing, route.GPX, route.Owner,route.Place, route.Date, route.Time);



                        using (MySqlCommand command = new MySqlCommand(query, gpxConnection.Connection))
                        {
                            successRows = command.ExecuteNonQuery();
                        }
                        if (successRows == 1)
                            result = string.Format("Route '{0}' saved OK", route.Dest);
                        else
                            result = string.Format("Database error: route '{0}' not saved", route.Dest);
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
            LogEntry log = new LogEntry(GetIP(), "GetRouteSummaries", "");

            routes = new List<Route>();

            if (gpxConnection.IsConnect())
            {
                try
                {
                    string query = string.Format("SELECT id,dest,description,distance,climbing,date,owner FROM routes ");

                    using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataRoutes = new DataTable();
                        routeAdapter.Fill(dataRoutes);
                        int length = dataRoutes.Rows.Count;
                        for (int row = 0; row < length; row++)
                        {
                            string dest = "", descrip="";
                            DateTime date = DateTime.MinValue;
                            DateTime time = DateTime.MinValue;
                            int id, owner=0, climbing = 0, distance = 0;
                            try
                            {
                                DataRow dr = dataRoutes.Rows[row];
                                id = (int)dr["id"];
                                try { dest = (string)dr["dest"]; } catch { }
                                try { descrip = (string)dr["description"]; } catch { }
                                try { climbing= (int)dr["climbing"]; } catch { }
                                try { distance = (int)dr["distance"]; } catch { }
                                try { date = (DateTime)dr["date"]; } catch { }
                                try { owner = (int)dr["owner"]; } catch { }

                                routes.Add(new Route(null, dest, descrip, distance, climbing, owner, "", date, time,id));
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

        public IEnumerable<Route> GetRoutesForDate(DateTime date)
        {
            // get details of routes available for a given date (but not yet the GPX data)
            LogEntry log = new LogEntry(GetIP(), "GetRouteSummaries", date.ToShortDateString());

            routes = new List<Route>();

            if (gpxConnection.IsConnect())
            {
                try
                {
        
                    //string query = string.Format("SELECT * FROM routes where routes.owner = {0}", userID);
                    string query = string.Format("SELECT dest,description,distance,climbing,owner FROM routes where routes.starttime");

                    using (MySqlDataAdapter routeAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataRoutes = new DataTable();
                        routeAdapter.Fill(dataRoutes);
                        int length = dataRoutes.Rows.Count;
                        for (int row = 0; row < length; row++)
                        {
                            string dest = "", descrip = "";
                            DateTime time = DateTime.MinValue;
                            int id, owner = 0, climbing = 0, distance = 0;
                            try
                            {
                                DataRow dr = dataRoutes.Rows[row];
                                id = (int)dr["id"];
                                try { dest = (string)dr["dest"]; } catch { }
                                try { descrip = (string)dr["descrip"]; } catch { }
                                try { climbing = (int)dr["climbing"]; } catch { }
                                try { distance = (int)dr["distance"]; } catch { }
                                try { time = (DateTime)dr["time"]; } catch { }
                                try { owner = (int)dr["owner"]; } catch { }

                                routes.Add(new Route(null, dest, descrip, distance, climbing, owner, "", date,time,id));
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
            log.Result = routes.Count.ToString() + " routes for " + date.ToShortDateString();
            log.Save(gpxConnection);
            gpxConnection.Close();
            return routes;
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


    }
}
