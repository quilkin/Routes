using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Runtime.Serialization;
using System.Data;
using MySql.Data;
using MySql.Data.MySqlClient;

namespace Routes
{
    [DataContract]
    public class Login
    {
        [DataMember(Name = "name")]
        public string Name { get; set; }
        [DataMember(Name = "pw")]
        public string PW { get; set; }
        [DataMember(Name = "email")]
        public string Email { get; set; }
        [DataMember(Name = "code")]
        public int Code { get; set; }
        [DataMember(Name = "id")]
        public int ID { get; set; }
        [DataMember(Name = "role")]
        public int Role { get; set; }

        public Login(string name, string pw)
        {
            Name = name;
            PW = pw;
        }
        public Login(string name, string pw, string email)
        {
            Name = name;
            PW = pw;
            Email = email;
        }
        public int CalcCode()
        {
            return (Name.Length + PW.Length) * 417 + Email.Length;
        }
    }

    [DataContract]
    public class Logdata
    {

        public static DateTime JSDateToDateTime(int date)
        {
            // date as days since 01/01/1970
            long millisecs = date * 1000 * 24 * 3600;
            DateTime t = new DateTime(1970, 1, 1);
            return t.AddMilliseconds(millisecs);
        }
        ///// <summary>
        ///// keeping member names small to keep json stringifications smaller
        ///// </summary>
        //[DataMember]
        //public string S { get; set; }
        //[DataMember]
        //public int T { get; set; }
        //[DataMember]
        //public List<float> V { get; set; }

        //public int ID { get; set; }

        //public Logdata()
        //{
        //    S = string.Empty;
        //    T = 0;
        //    V = new List<float>();
        //}
        //public Logdata(string id, DateTime dt, List<float> vals)
        //{
        //    S = id;
        //    T = (int)TimeSpan.FromTicks(dt.Ticks).TotalMinutes;
        //    V = vals;
        //}
        //public Logdata(int id, DateTime dt, List<float> vals)
        //{
        //    ID = id;
        //    T = (int)TimeSpan.FromTicks(dt.Ticks).TotalMinutes;
        //    V = vals;
        //}
        //public Logdata(string id, int totalmins, List<float> vals)
        //{
        //    S = id;
        //    T = totalmins;
        //    V= vals;
        //}
        //public Logdata(int totalmins, List<float> vals)
        //{
        //    T = totalmins;
        //    V = vals;
        //}
        //public Logdata(int id, int totalmins, List<float> vals)
        //{
        //    ID = id;
        //    T = totalmins;
        //    V = vals;
        //}

    }

    //[DataContract]
    //public class DataRequest
    //{
    //    [DataMember]
    //    public List<int> IDlist { get; set; }
    //    [DataMember]
    //    public int From{ get; set; }
    //    [DataMember]
    //    public int To { get; set; }

    //    public DataRequest()
    //    {
    //        IDlist = new List<int>(); 
    //        From = 0;
    //        To =  0;
    //    }
    //    public DataRequest(List<int> idlist, int from, int to)
    //    {
    //        IDlist = idlist;
    //        From = from;
    //        To = to;
    //    }
    //}

    //[DataContract]
    //public class UploadResult
    //{
    //    [DataMember]
    //    public int Overlaps { get; set; }
    //    [DataMember]
    //    public int Saved { get; set; }

    //    public UploadResult()
    //    {
    //        Overlaps = 0;
    //        Saved = 0;
    //    }
    //    public UploadResult(int sv, int ov)
    //    {
    //        Overlaps = ov;
    //        Saved = sv;
    //    }
    //}

    [DataContract]
    public class Route
    {
        [DataMember(Name = "route")]
        public string GPX { get; set; }
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
        public int ID{ get; set; }
        //[DataMember(Name= "date")]
        //public int Date { get; set; }
        //[DataMember(Name = "time")]
        //public int Time { get; set; }
        //[DataMember(Name = "place")]
        //public string Place { get; set; }

        public Route(string gpx, string dest, string descrip,int d, int climb, int ow, int id)
        {
            GPX = gpx;
            Dest = dest;
            Descrip = descrip;
            Distance = d;
            Climbing =  climb;
            Owner = ow;
            //Date = date;
            //Time = time;
            //Place = place;
            ID = id;
        }

    }

    [DataContract]
    public class Ride
    {
        [DataMember(Name = "dest")]
        public string Dest { get; set; }

        [DataMember(Name = "leader")]
        public int Leader { get; set; }

        [DataMember(Name = "rideID")]
        public int ID { get; set; }

        [DataMember(Name = "date")]
        public int Date { get; set; }

        [DataMember(Name = "time")]
        public int Time { get; set; }

        [DataMember(Name = "meetingAt")]
        public string MeetAt { get; set; }

        public Ride(string dest, int lead, int id, int date, int time, string meet)
        {
             Dest = dest;
            Leader = lead;
            Date = date;
            Time = time;
            MeetAt = meet;
            ID = id;
        }

    }

    public class LogEntry
    {
        public string IP { get; set; }
        public string Function { get; set; }
        public string Args { get; set; }
        public string Error { get; set; }
        public string Result { get; set; }

        public LogEntry(string ip,string func,string args)
        {
            IP = ip;
            Args = args;
            Function = func;

        }
        public LogEntry()
        {
        }
        public void Save(DBConnection conn)
        {
            //if (this.Error != null)
            //    this.Error = this.Error.Substring(0, 125);
            //if (this.Result != null)
            //    this.Result = this.Result.Substring(0, 125);
            string query = string.Format("insert into log (time,ip,func,args,result,error) values ('{0}','{1}','{2}','{3}','{4}','{5}')",
                Routes.TimeString(DateTime.Now), this.IP, this.Function, this.Args,this.Result,this.Error);

            using (MySqlCommand command = new MySqlCommand(query, conn.Connection))
            {
                command.ExecuteNonQuery();
            }

        }
    }
}