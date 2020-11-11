using System;
using System.Data;
using System.Runtime.Serialization;
using System.Net.Mail;
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
        public string EmailCode { get; set; }
        [DataMember(Name = "id")]
        public int ID { get; set; }
        [DataMember(Name = "role")]
        public int Role { get; set; }
        [DataMember(Name = "units")]
        public char Units { get; set; }

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

    }


    public partial class Routes : IRoutes, IDisposable
    {

        /// <summary>
        /// Log in to the system
        /// </summary>
        /// <param name="login">login object with just a username and password</param>
        /// <returns>login object with details of role and user id</returns>
        public Login Login(Login login)
        {

            string hash = Logdata.GetHash(login.PW);
            LogEntry log = new LogEntry("Login", login.Name);


            string query = string.Format("SELECT Id, name, pw, email, role, units FROM logins where name = '{0}'", login.Name);
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
                        string dbemail = (string)dr["email"];
                        dbemail = dbemail.Trim();

                        if (dbname == login.Name && dbpw == hash)
                        {
                            login.Role = (int)dr["role"];
                            login.ID = (int)dr["id"];
                            login.Email = (string)dr["email"];
                            login.Units = ((string)dr["units"])[0];
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

            LogEntry log = new LogEntry("Register2", login.Name + " " + login.EmailCode);
            string result = "";
            if (login.EmailCode == Logdata.GetHash(login.Name + login.Name))
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
            string hash = Logdata.GetHash(login.PW);
            LogEntry log = new LogEntry("Signup", login.Name);


            MailAddress emailAddr;
            string result = "OK, now please wait for an email and click the link to complete your registration";
            try
            {
                emailAddr = new MailAddress(login.Email);
                // Valid address
            }
            catch
            {
                return ("This email address appears to be invalid");
            }
            if (login.PW.Length < 4 || login.PW.Length > 10)
                return ("Password must be between 4 and 10 characters");

  

            if (gpxConnection.IsConnect())
            {
                // check username and email
                string query = "SELECT Id, name, pw, email FROM logins";
                try
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
                            string dbemail = (string)dr["email"];
                            dbemail = dbemail.Trim();
                            if (dbname == login.Name)
                            {
                                return ("Sorry, this username has already been taken");
                            }
                            if (dbemail == login.Email)
                            {
                                return ("Sorry, only one login allowed per email address");
                            }
                            if (EmailConnection.IsValidEmail(dbemail) == false)
                            {
                                return ("Sorry, this email doesn't appear to be valid");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    return "DB error: " + ex.Message;
                }
                
                // create and send an email
                try
                {
                    // create a code based on data
                    login.EmailCode = Logdata.GetHash(login.Name+login.Name);

                    string URLstr = string.Format(Connections.serviceURL + "?user={0}&regcode={1}", login.Name, login.EmailCode);
                    //string URLstr = string.Format("http://localhost/routes/www?user={0}&regcode={1}",login.Name, login.EmailCode);

                    EmailConnection ec = new EmailConnection();
                    MailAddress from = new MailAddress("admin@quilkin.co.uk");
                    MailMessage message = new MailMessage(from, emailAddr)
                    {
                        Subject = "TCC rides signup",
                        Body = string.Format("Please click {0}  to complete your registration", URLstr)
                    };

                    try
                    {
                        SmtpClient client = new System.Net.Mail.SmtpClient(ec.Server)
                        {
                            Credentials = new System.Net.NetworkCredential(ec.User, ec.PW)
                        };
                        client.Send(message);

                        // save the login details but with role as zero so login won't yet work
                        log = new LogEntry("Register1", login.Name + " " + login.EmailCode);
                        query = string.Format("insert into logins (name, pw, email,role,messagetime) values ('{0}','{1}','{2}',{3},'{4}')",
                            login.Name, hash, login.Email, 0, Logdata.TimeString(DateTime.Now));

                        try
                        {
                            var cmd = new MySqlCommand(query, gpxConnection.Connection);
                            cmd.ExecuteNonQuery();
                            result = "Thank you, please wait for an email and click link to complete registration";
                        }
                        catch (Exception ex2)
                        {
                            result = "There is a database error, please try again:" + ex2.Message; ;
                        }
                    }
                    catch (Exception ex)
                    {
                        result = "Sorry, there is an error with the email service: " + ex.Message;
                    }



                }
                catch (Exception ex2)
                {
                    return "Error: " + ex2.Message;
                }
                finally
                {
                    log.Result = result;
                    log.Save(gpxConnection);

                    gpxConnection.Close();


                }
                return result;
            }
            else

                return "No DB Connecton";

        }

        public string ChangeAccount(Login login)
        {
           
            LogEntry log = new LogEntry("ChangeAccount", login.Name);
            string query;

            if (gpxConnection.IsConnect())
            {
                try
                {
                    if (login.PW != string.Empty) // has actually been changed
                    {
                        string hash = Logdata.GetHash(login.PW);
                        query = string.Format("update logins set pw = '{0}' where id = {1}", hash, login.ID);
                        var cmd = new MySqlCommand(query, gpxConnection.Connection);
                        cmd.ExecuteNonQuery();

                    }
                    if (login.Email != string.Empty) // has actually been changed
                    {
                        query = string.Format("update logins set email = '{0}' where id = {1}", login.Email, login.ID);
                        var cmd = new MySqlCommand(query, gpxConnection.Connection);
                        cmd.ExecuteNonQuery();

                    }
                    if (login.Name != string.Empty) // has actually been changed
                    {
                        query = string.Format("update logins set name = '{0}' where id = {1}", login.Name, login.ID);
                        var cmd = new MySqlCommand(query, gpxConnection.Connection);
                        cmd.ExecuteNonQuery();
                    }
                    if (true)
                    {
                        query = string.Format("update logins set units = '{0}' where id = {1}", login.Units, login.ID);
                        var cmd = new MySqlCommand(query, gpxConnection.Connection);
                        cmd.ExecuteNonQuery();
                    }


                }
                catch (Exception ex2)
                {
                    return "There is a database error, some details not changed, please try again: " + ex2.Message;
                }
            }
            else
                return "No DB Connecton";

            return "OK";
        }


        public string ForgetPassword(string email)
        {
            LogEntry log = new LogEntry("ForgetPassword", email);

            string result = "OK, now please wait for an email and click the link to set a new password";
            string username = "";
            MailAddress emailAddr;
            try
            {
                emailAddr = new MailAddress(email);
                // Valid address
            }
            catch
            {
                return ("This email address appears to be invalid");
            }

            if (gpxConnection.IsConnect())
            {
                string query = string.Format("SELECT Id, name, email FROM logins where email = '{0}'",email);
                try
                {
                    using (MySqlDataAdapter loginAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataLogins = new DataTable();
                        loginAdapter.Fill(dataLogins);
                        int count = dataLogins.Rows.Count;
                        if (count == 1)
                        {
                            DataRow dr = dataLogins.Rows[0];
                            string dbname = (string)dr["name"];
                            username = dbname.Trim();

                        }
                        else if (count == 0)
                        {
                            return string.Format("Error: cannot find an account with that email");
                        }
                        else
                        {
                            return string.Format("Error: {0} users found with that email", dataLogins.Rows.Count);
                        }
                    }
                }
                catch (Exception ex)
                {
                    return "DB error: " + ex.Message;
                }

                // create and send an email
                try
                {
                    // create a code based on data
                    string emailCode = Logdata.GetHash(username + username);

                   // string URLstr = string.Format("https://quilkin.co.uk/tccrides?pwuser={0}&regcode={1}", username, emailCode);
                    string URLstr = string.Format(Connections.serviceURL + "?pwuser={0}&regcode={1}",username, emailCode);

                    EmailConnection ec = new EmailConnection();
                    MailAddress from = new MailAddress("admin@quilkin.co.uk");
                    MailMessage message = new MailMessage(from, emailAddr)
                    {
                        Subject = "TCC rides forgotten password",
                        Body = string.Format("Please click {0}  to reset your password or other details.\n\rFor security, this link will expire in 15 minutes!", URLstr)
                    };

                    try
                    {
                        SmtpClient client = new System.Net.Mail.SmtpClient(ec.Server)
                        {
                            Credentials = new System.Net.NetworkCredential(ec.User, ec.PW)
                        };
                        client.Send(message);

                        // save the time this message was delivered
                        
                        query = string.Format("update logins set messagetime = '{0}' where email = '{1}'", Logdata.DBTimeString(DateTime.Now),email);

                        try
                        {
                            var cmd = new MySqlCommand(query, gpxConnection.Connection);
                            cmd.ExecuteNonQuery();
                            
                        }
                        catch (Exception ex2)
                        {
                            result = "There is a database error, please try again:" + ex2.Message; ;
                        }
                        result = "OK, now please wait for an email and click the link to set a new password";
                       
                    }
                    catch (Exception ex)
                    {
                        result = "Sorry, there is an error with the email service: " + ex.Message;
                    }

                }
                catch (Exception ex2)
                {
                    return "Error: " + ex2.Message;
                }
                finally
                {
                    log.Result = result;
                    log.Save(gpxConnection);

                    gpxConnection.Close();


                }
                return result;
            }
            else

                return "No DB Connecton";

        }
        public string CheckTimeout(string username)
        {
            LogEntry log = new LogEntry("CheckTimeout", username);

            if (gpxConnection.IsConnect())
            {
                string query = string.Format("SELECT id, messagetime FROM logins where name = '{0}'", username);
                try
                {
                    using (MySqlDataAdapter loginAdapter = new MySqlDataAdapter(query, gpxConnection.Connection))
                    {
                        dataLogins = new DataTable();
                        loginAdapter.Fill(dataLogins);
                        int count = dataLogins.Rows.Count;
                        if (count == 1)
                        {
                            DataRow dr = dataLogins.Rows[0];
                            DateTime msgTime = (DateTime)dr["messagetime"];
                            int id = (int)dr["id"];
                            TimeSpan since = DateTime.Now - msgTime;
                            if (since.TotalMinutes > 15)
                            {
                                return "Sorry, email code has timed out. Please request your details again.";
                            }
                            else
                            {
                                return "OK" + id.ToString();
                            }


                        }
                        else
                        {
                            return string.Format("DB Error: {0} users found ", dataLogins.Rows.Count);
                        }
                    }
                }
                catch (Exception ex)
                {
                    return "DB error: " + ex.Message;
                }


            }
            else

                return "No DB Connecton";
        }

    }

}