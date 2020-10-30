using System;
using System.Runtime.Serialization;
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
            return (Name.Length + (int)(Name[0])) * 417 + Email.Length;
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

    }

    [DataContract]
    public class Route
    {
        [DataMember(Name = "url")]
        public string URL{ get; set; }
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


        public Route(string url, string dest, string descrip,int d, int climb, int ow, int id)
        {
            URL = url;
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


        public Participant(string rider,  int id)
        {
            Rider = rider;
            rideID = id;
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

            string query = string.Format("insert into log (time,ip,func,args,result,error) values ('{0}','{1}','{2}','{3}','{4}','{5}')",
                Routes.TimeString(DateTime.Now), this.IP, this.Function, this.Args, this.Result, this.Error);

            using (MySqlCommand command = new MySqlCommand(query, conn.Connection))
            {
                command.ExecuteNonQuery();
            }

        }
    }
}