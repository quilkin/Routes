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

        //SqlConnection gpxConnection;
        DBConnection gpxConnection = DBConnection.Instance();

        //DataTable dataLogs;
        //List<Logdata> logdata;
        //List<Sensor> sensors;
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
            LogEntry log = new LogEntry(GetIP(), "SaveRoute", route.Owner + " " + route.Dest);

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
                    using (MySqlDataAdapter sensorAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataLogins = new DataTable();
                        sensorAdapter.Fill(dataLogins);

                        if (dataLogins.Rows.Count == 0)
                        {
                            exists = false;
                        }
                    }
                    if (exists)
                    {
                        result = "This route destination already exists. Please choose another name";
                    }

                    else
                    {
                        query = string.Format("insert into routes (dest,distance,climbing,route,owner) values ('{0}','{1}','{2}','{3}','{4}')",
                            route.Dest, route.Distance, route.Climbing, route.GPX, route.Owner);



                        using (MySqlCommand command = new MySqlCommand(query, gpxConnection.Connection))
                        {
                            successRows = command.ExecuteNonQuery();
                        }
                        if (successRows == 1)
                            result = string.Format("Route {0} saved OK", route.Dest);
                        else
                            result = string.Format("Database error: route {0} not saved", route.Dest);
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

        //public IEnumerable<Sensor> GetSensorNames(int userID)
        //{

        //    LogEntry log = new LogEntry(getIP(), "GetSensorNames", userID.ToString());

        //    sensors = new List<Sensor>();

        //    if (gpxConnection == null)
        //    {
        //        try
        //        {
        //            gpxConnection = new SqlConnection(connection);
        //            gpxConnection.Open();
        //        }
        //        catch (Exception ex)
        //        {
        //            Trace.WriteLine(ex.Message);
        //            return null;
        //        }
        //    }

        //    // get sensors associated to that user
        //    string query = string.Format("SELECT * FROM sensors where sensors.owner = {0}", userID);

        //    using (SqlDataAdapter riderAdapter = new SqlDataAdapter(query, gpxConnection))
        //    {
        //        dataLogs = new DataTable();
        //        riderAdapter.Fill(dataLogs);
        //        // ToDo: not efficient to convert table to  List<> in order to provide the data
        //        int length = dataLogs.Rows.Count;
        //        for (int row = 0; row < length; row++)
        //        {
        //            string name = "", serial = "", descrip = "";
        //            int id, period = 60, alarmlow = 0, alarmhigh = 0;
        //            try
        //            {
        //                DataRow dr = dataLogs.Rows[row];
        //                id = (int)dr["id"];
        //                try { name = (string)dr["name"]; } catch { }
        //                try { serial = (string)dr["serial"]; } catch { }
        //                try { descrip = (string)dr["descrip"]; } catch { }
        //                try { alarmlow = (int)dr["alarmlow"]; } catch { }
        //                try { alarmhigh = (int)dr["alarmhigh"]; } catch { }
        //                try { period = (int)dr["period"]; } catch { }

        //                sensors.Add(new Sensor(id, serial, name, descrip, alarmlow, alarmhigh, period, userID));
        //            }
        //            catch (Exception ex)
        //            {
        //                Trace.WriteLine(ex.Message);
        //                log.Error = ex.Message;
        //            }
        //        }
        //    }
        //    log.Result = sensors.Count.ToString() + " sensors";
        //    log.Save(gpxConnection);
        //    gpxConnection.Close();
        //    return sensors;
        //}



        ///// <summary>
        ///// Get all saved data for set of  given devices between specified times.
        ///// Times are passed as 'smalldatetime' i.e. number of minutes since 01.01.1970
        ///// </summary>
        ///// <param name="id">device serial number</param>
        ///// <param name="from">start of data reqd</param>
        ///// <param name="to">end of data reqd</param>
        ///// <returns></returns>
        //public IEnumerable<Logdata> GetLogdata(DataRequest req)
        //{
        //    LogEntry log = new LogEntry(getIP(), "GetLogdata", req.ToString());


        //    logdata = new List<Logdata>();
        //    bool closeneeded = false;
        //    //int thisID = 0;

        //    if (gpxConnection == null)
        //    {
        //        try
        //        {
        //            gpxConnection = new SqlConnection(connection);
        //            gpxConnection.Open();
        //            closeneeded = true;
        //        }
        //        catch (Exception ex)
        //        {
        //            Trace.WriteLine(ex.Message);

        //        }
        //    }

        //    string idList = string.Empty;
        //    foreach (int id in req.IDlist)
        //    {
        //        idList += id.ToString();
        //        idList += ',';
        //    }
        //    //char[] comma = { };
        //    idList = idList.TrimEnd(',');


        //    string query = string.Format("SELECT logdata.id, logdata.time, logdata.value FROM logdata  WHERE logdata.id in ( {0} ) and logdata.time >= '{1}' and logdata.time <= '{2}' ORDER BY logdata.time,logdata.id",
        //        idList, req.From, req.To);
        //    using (SqlDataAdapter riderAdapter = new SqlDataAdapter(query, gpxConnection))
        //    {
        //        dataLogs = new DataTable();
        //        riderAdapter.Fill(dataLogs);
        //        // ToDo: not efficient to convert table to  List<> in order to provide the data
        //        int length = dataLogs.Rows.Count;
        //        ArrayList IDs = new ArrayList();
        //        List<float> vals = new List<float>();
        //        // initalise vals with 'missing data'
        //        foreach (int i in req.IDlist)
        //            vals.Add(-273);
        //        int time = 0, oldTime = 0;
        //        DataRow dr;

        //        // Need to assemble data into values with the same timestamps.
        //        // If data is missing for some IDs at a certain time, need to insert 'missing data' values

        //        // First, need to run through list to find all the IDs it may contain - some IDs may not be present in the first few records,
        //        //    and we need to have the finished list in ID order.
        //        for (int row = 0; row < length; row++)
        //        {
        //            try
        //            {
        //                dr = dataLogs.Rows[row];
        //                int id = (int)dr["id"];

        //                int idIndex = IDs.IndexOf(id);
        //                if (idIndex < 0)
        //                {
        //                    // haven't seen one of these before
        //                    IDs.Add(id);
        //                }

        //            }
        //            catch (Exception ex)
        //            {
        //                Trace.WriteLine(ex.Message);
        //                log.Error = ex.Message;
        //            }
        //        }
        //        if (IDs.Count < req.IDlist.Count)
        //        {
        //            // one sensor asked for has no data at all
        //            foreach (int id in req.IDlist)
        //            {
        //                if (IDs.Contains(id) == false)
        //                {
        //                    IDs.Add(id);
        //                }
        //            }
        //        }
        //        IDs.Sort();
        //        // now actually sort the data
        //        for (int row = 0; row < length; row++)
        //        {
        //            try
        //            {
        //                dr = dataLogs.Rows[row];
        //                time = (int)dr["time"];
        //                int id = (int)dr["id"];
        //                //if (oldTime == 0) oldTime = time;

        //                int idIndex = IDs.IndexOf(id);
        //                float val = (float)dr["value"];
        //                vals[idIndex] = val;
        //                if (time != oldTime)
        //                {
        //                    // this will be a new record
        //                    logdata.Add(new Logdata(time, vals));
        //                    //vals.Clear();
        //                    vals = new List<float>();
        //                    // initalise new vals with 'missing data'
        //                    foreach (int i in req.IDlist)
        //                        vals.Add(-273);
        //                    oldTime = time;
        //                }
        //            }
        //            catch (Exception ex)
        //            {
        //                Trace.WriteLine(ex.Message);
        //                log.Error = ex.Message;
        //            }
        //        }
        //    }
        //    log.Result = "logdata size: " + logdata.Count;
        //    log.Save(gpxConnection);

        //    if (closeneeded)
        //        gpxConnection.Close();
        //    return logdata;
        //}

        ///// <summary>
        ///// Save a chunk of data (for a single device)
        ///// </summary>
        ///// <param name="newdata"></param>
        ///// <returns></returns>
        //public UploadResult SaveLogdata(IEnumerable<Logdata> newdata)
        //{
        //    LogEntry log = new LogEntry(getIP(), "SaveLogdata", newdata.Count().ToString() + " records");
        //    log.Error = "Starting SaveLogdata";


        //    // find start and end times of new data
        //    int firstnewdata = int.MaxValue;
        //    int lastnewdata = int.MinValue;
        //    string serial = string.Empty;
        //    int thisID = 0;

        //    try
        //    {
        //        gpxConnection = new SqlConnection(connection);
        //        gpxConnection.Open();

        //    }
        //    catch (Exception ex)
        //    {
        //        Trace.WriteLine(ex.Message);

        //    }
        //    log.Save(gpxConnection);
        //    try
        //    {
        //        foreach (Logdata data in newdata)
        //        {
        //            if (data.T > lastnewdata)
        //                lastnewdata = data.T;
        //            if (data.T < firstnewdata)
        //                firstnewdata = data.T;
        //            if (serial == string.Empty) serial = data.S;
        //            else if (data.S != null && data.S.Length > 0 && serial != data.S)
        //            {
        //                string err = "Cannot save data, contains values from more than one device";
        //                Trace.WriteLine(err);
        //                log.Error = err;
        //                log.Save(gpxConnection);
        //                gpxConnection.Close();
        //                return new UploadResult(0, 0);
        //            }
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        Trace.WriteLine(ex.Message);
        //        log.Error = ex.Message;
        //        log.Save(gpxConnection);
        //        gpxConnection.Close();
        //        return new UploadResult(0, 0);
        //    }
        //    if (serial.Length > 20)
        //        serial = serial.Substring(0, 18);
        //    log.Error = "SaveLogdata, serial = " + serial;
        //    log.Save(gpxConnection);

        //    // find sensor ID from serial number
        //    string query = string.Format("SELECT sensors.id FROM sensors  WHERE sensors.serial = '{0}' ", serial);
        //    using (SqlDataAdapter idAdapter = new SqlDataAdapter(query, gpxConnection))
        //    {
        //        dataLogs = new DataTable();
        //        idAdapter.Fill(dataLogs);
        //        // ToDo: not efficient to convert table to  List<> in order to provide the data
        //        if (dataLogs.Rows.Count > 0)
        //        {

        //            try
        //            {
        //                DataRow dr = dataLogs.Rows[0];
        //                thisID = (int)dr["id"];
        //            }
        //            catch (Exception ex)
        //            {
        //                Trace.WriteLine(ex.Message);
        //                log.Error = ex.Message;
        //                log.Save(gpxConnection);
        //                gpxConnection.Close();
        //                return new UploadResult(0, 0);
        //            }
        //        }
        //        log.Error = "SaveLogdata, rows = " + dataLogs.Rows.Count;
        //        log.Save(gpxConnection);
        //    }



        //    List<int> ids = new List<int>();
        //    int firstolddata = int.MaxValue;
        //    int lastolddata = int.MinValue;

        //    if (thisID > 0)
        //    {
        //        ids.Add(thisID);
        //        // now get any existing data between these times. Just one ID to put into the array of requests
        //        if (GetLogdata(new DataRequest(ids, firstnewdata, lastnewdata)) != null)
        //        {
        //            foreach (Logdata data in logdata)
        //            {
        //                if (data.T >= lastolddata)
        //                    lastolddata = data.T;
        //                if (data.T <= firstolddata)
        //                    firstolddata = data.T;
        //            }
        //        }
        //    }
        //    else
        //    {
        //        // ID not found, must be a new sensor
        //        try
        //        {
        //            query = string.Format("insert into sensors (serial,name,owner,timeadded) values ('{0}','{1}','{2}','{3}')", serial, "no name", 0, TimeString(DateTime.Now));
        //            using (System.Data.SqlClient.SqlCommand command = new SqlCommand(query, gpxConnection))
        //            {
        //                command.ExecuteNonQuery();

        //            }
        //        }
        //        catch (Exception ex)
        //        {
        //            Trace.WriteLine(ex.Message);
        //            log.Error = ex.Message;
        //            log.Save(gpxConnection);
        //            gpxConnection.Close();
        //            return new UploadResult(0, 0);
        //        }

        //    }

        //    log.Error = "SaveLogdata 3";
        //    log.Save(gpxConnection);

        //    int saved = 0, notsaved = 0;
        //    UploadResult result = null;
        //    try
        //    {
        //        foreach (Logdata data in newdata)
        //        {
        //            if (data.T >= firstolddata && data.T <= lastolddata)
        //            {
        //                // data already stored for this time (unless gaps have somehow been introduced??)
        //                ++notsaved;
        //                continue;
        //            }

        //            query = string.Format("insert into logdata (id, time, value) values ('{0}','{1}','{2}')\n\r",
        //                thisID, data.T, data.V[0]);

        //            using (System.Data.SqlClient.SqlCommand command = new SqlCommand(query, gpxConnection))
        //            {
        //                command.ExecuteNonQuery();
        //                ++saved;
        //            }
        //        }
        //        result = new UploadResult(saved, notsaved);
        //        log.Result = new JavaScriptSerializer().Serialize(result);
        //        log.Save(gpxConnection);
        //    }
        //    catch (Exception ex)
        //    {

        //        Trace.WriteLine(ex.Message);
        //        log.Error = ex.Message;
        //        log.Save(gpxConnection);
        //        return new UploadResult(0, 0);
        //    }
        //    finally
        //    {
        //        gpxConnection.Close();
        //    }
        //    return result;
        //}
    }
}
