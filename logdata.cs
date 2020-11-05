﻿using System;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.ServiceModel.Channels;
using MySql.Data.MySqlClient;

namespace Routes
{
    public class EmailConnection
    {
        public string Server { get { return Connections.emailServer; } }
        public string User { get { return Connections.emailUserName; } }
        public string PW { get { return Connections.emailPassword; } }
        public static bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
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


        //public string Password { get; set; }
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
                string connstring = string.Format("Server={0}; port=3306; database={1}; UID={2}; password={3}", server, dbName, user, pw);
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


    [DataContract]
    public class Logdata
    {
        public static string GetHash(string text)
        {
            if (String.IsNullOrEmpty(text))
                return String.Empty;

            using (var sha = new System.Security.Cryptography.SHA256Managed())
            {
                byte[] textData = System.Text.Encoding.UTF8.GetBytes(text);
                byte[] hash = sha.ComputeHash(textData);
                return BitConverter.ToString(hash).Replace("-", String.Empty);
            }
        }
        //public static string GetSmallHash(string text)
        //{
        //    if (String.IsNullOrEmpty(text))
        //        return String.Empty;

        //    using (var sha = new System.Security.Cryptography.SHA1Managed())
        //    {
        //        byte[] textData = System.Text.Encoding.UTF8.GetBytes(text);
        //        byte[] hash = sha.ComputeHash(textData);
        //        return BitConverter.ToString(hash).Replace("-", String.Empty);
        //    }
        //}
        public static DateTime JSDateToDateTime(int date)
        {
            // date as days since 01/01/1970
            long millisecs = date * 1000 * 24 * 3600;
            DateTime t = new DateTime(1970, 1, 1);
            return t.AddMilliseconds(millisecs);
        }

        public static string TimeString(DateTime time)
        {
            if (time == DateTime.MinValue)
                return System.DBNull.Value.ToString();
            return string.Format("{0}{1}{2} {3}:{4}:{5}",
                time.Year, time.Month.ToString("00"), time.Day.ToString("00"),
                time.Hour.ToString("00"), time.Minute.ToString("00"), time.Second.ToString("00"));
        }
        public static string DBTimeString(DateTime time)
        {
            if (time == DateTime.MinValue)
                return System.DBNull.Value.ToString();
            return string.Format("{0}-{1}-{2} {3}:{4}:{5}",
                time.Year, time.Month.ToString("00"), time.Day.ToString("00"),
                time.Hour.ToString("00"), time.Minute.ToString("00"), time.Second.ToString("00"));
        }

    }


    public class LogEntry
    {
        //public string IP { get; set; }
        public string Function { get; set; }
        public string Args { get; set; }
        public string Error { get; set; }
        public string Result { get; set; }

        public LogEntry(string func,string args)
        {
            Args = args;
            Function = func;

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
        public LogEntry()
        {
        }
        public void Save(DBConnection conn)
        {

            string query = string.Format("insert into log (time,ip,func,args,result,error) values ('{0}','{1}','{2}','{3}','{4}','{5}')",
                Logdata.TimeString(DateTime.Now), GetIP(), this.Function, this.Args, this.Result, this.Error);

            using (MySqlCommand command = new MySqlCommand(query, conn.Connection))
            {
                command.ExecuteNonQuery();
            }

        }
    }
}