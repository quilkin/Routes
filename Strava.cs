using System;
using System.Data;
using System.Runtime.Serialization;
using System.Net.Mail;
using MySql.Data.MySqlClient;
using System.IO;

namespace Routes
{


    public partial class Routes : IRoutes, IDisposable
    {

        public string StravaAuth(string data)
        {
            File.WriteAllText("stravadata.txt", data);
            return "OK";
        }
        public string GetStravaAuth()
        {
            string result = File.ReadAllText("stravadata.txt");
            return result;
        }
    }
}