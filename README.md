- [icsorg - Import Calendar Events into Emacs Org Mode](#sec-1)
- [Installation](#sec-2)
- [Usage](#sec-3)
- [Workflow](#sec-4)
- [Add support to retrieve ics file via URL](#sec-5)


# icsorg - Import Calendar Events into Emacs Org Mode<a id="sec-1"></a>

This is a very simple script to assist in importing calendar events from an ICS file into an Emacs Org mode file. Once imported, the events will show up in your Org agenda.

This work was very much inspired by the article [Google Calendar Synchronization](https://orgmode.org/worg/org-tutorials/org-google-sync.html). This script fulfils a role similar to the `ics2org` Awk script referenced in that article. Essentially, `icsorg` will read data from an `.ics` file, parse it to extract all the events and generate an entry in an `Emacs Org mode` file for each event. Provided the output file is included in the list of files scanned by org to generate the agenda, these events will show up as entries in the agenda. This script does not do any upstream synchronisation - it does not push events back out to a remote service like *Google* or *Office 365*.

<div class="notes" id="org81f1bba">
<p>
<b>Caveats</b>: This script has not been heavily tested and has only been run on
 Linux platforms. I wrote it to scratch my own itch, which it appears to be
 doing quite effectively. I don't run Windows, but will likely also use it on
 macOS.
</p>

</div>

# Installation<a id="sec-2"></a>

A prerequisite for running this script is `node* and *npm*. It is recommended to have at least =node` v14.x.x, but the script should work with `node` 12.x.x. It is recommended you install the script globally as this will ensure it is placed in the `bin` directory used by globally installed modules, which is normally on your execution `PATH`.

Install the script either by running

    npm i -g icsorg

Alternatively, you can use the `npx` command to both install and run the script. e.g.

    npx icsorg -h

The above line will install the script and run it with the `-h` option, which will display a short help message.

# Usage<a id="sec-3"></a>

The script has a short help screen which is displayed when you use the `-h` option. e.g.

    ─tim@tim-desktop ~/Projects/javascript/icsorg/src  ‹master*› 
    ╰─➤  icsorg -h
    Usage: icsorg <optional arguments>
    
    Arguments:
      -a                 Author. Used for attendee matching
      -e                 Email. Used for attendee matching
      -f                 Number of days into the future to include events from. Default 365
      -h | --help        Display short help message
      -c config_file     Path to configuration file
      -i input_file      Path to the ICS file to use as input
      -o output_file     Path to the output file to be created (org file)
      -p days            Number of days in the past to include events from. Default 7
      --dump             Dump the current configuration and exit
    
    By default, the script will look for a file called '.icsorgrc' in the
    user's home directory. This can be overridden with the -c switch
    Command line switches override values in the configuration file
    
    The configuration file consists of NAME=value lines. The file will be
    processed using the dotenv module, which will create environment variables
    from the values in this file. The expected values are -
    
      AUTHOR -   Your name. Used to identify you in meeting attendee lists
      EMAIL  -   Your email address. Also used to identify you in attendee lists
      ICS_FILE - Path to ICS file to use for input. This can be overridden with the -i option
      ORG_FILE - Path to the org file to write events to. It will override any existing.
                 It can be overridden with the -o option
      TITLE -    The #+TITLE: header to use in the org file. Defaults to 'Calendar'
      CATEGORY - A value for #+CATEGORY header. No default
      STARTUP -  A value for #+STARTUP header. No default
      FILETAGS - A value for #+FILETAGS header. No default
      PAST -     Number of days in the past to include events from. Default 7
      FUTURE -   Number of days into the future to include events from. Default 365
    
      Homepage - https://github.com/theophilusx/icsorg
    ╭─tim@tim-desktop ~/Projects/javascript/icsorg/src  ‹master*› 
    ╰─➤  _

The script uses the `dotenv` module to read a resource file of setting used by the script. Most of these settings can be overridden with command line options. The script looks for this resource file in your home directory by default. A sample configuration file is shown below.

    AUTHOR="Fred Flintstone" # Your name - used to match attendees for an event
    EMAIL=fred@bedrock.com   # Your email address - also used for attendee matching
    ICS_FILE=/home/fred/google.ics # location of the ics file to use as input
    ORG_FILE=/home/fred/Documents/org-data/calendar.org # file for output - an org mode file
    TITLE="Google Calendar" # Org file header settings
    CATEGORY=CALENDAR
    STARTUP="hidestars overview"
    FILETAGS=EVENT
    PAST=30 # how many days into the past to look for events
    FUTURE=365 # how many days into the future to look for events

The script, using the above settings, would generate an org file of events. A partial sample output is below.

```org
#+TITLE:       Google Calendar
#+AUTHOR:      Fred Flintstone
#+EMAIL:       fred@bedrock.comm
#+DESCRIPTION: converted using icsorg node script
#+CATEGORY:    CALENDAR
#+STARTUP:     hidestars overview
#+FILETAGS:    EVENT

* Rock, Stone and Pebble Conference
:PROPERTIES:
:ICAL_EVENT:    t
:ID:            5jor3ms6hetcuepot9fark5pg9@google.com
:ORGANIZER:     [[mailto:fred@bedrock.com][fred@bedrock.com]] 
:STATUS:        CONFIRMED
:LAST_MODIFIED: [2021-08-06 Fri 00:42]
:LOCATION:      The Big Boulder Conference Center
:DURATION:      1 d 00:00 hh:mm
:ATTENDEES:     [[mailto:fred@bedrock.com][fred@bedrock.com]] (Accepted) [[mailto:barney@bedrock.com][barney@bedrock.com]] (ACCEPTED)
:END:
<2021-08-06 Fri 00:00>--<2021-08-07 Sat 00:00>

All day talk - large lunch provided. Bowling afterwards.
* Shopping with Wilma
:PROPERTIES:
:ICAL_EVENT:    t
:ID:            4ntv8nl3b4kjckik6q0rconh05@google.com
:ORGANIZER:     [[mailto:fred@bedrock.com][[[mailto:wilma@bedrock.com][wilma@bedrock.com]] 
:STATUS:        CONFIRMED
:LAST_MODIFIED: [2021-08-05 Thu 12:28]
:LOCATION:      Downtown Bedrock
:DURATION:      00:50 hh:mm
:ATTENDEES:     [[mailto:fred@bedrock.com][fred@bedrock.com]] (MAYBE) [[mailto:wilma@bedrock.com][wilma@bedrock.com]] (ACCEPTED)
:END:
<2021-08-05 Thu 12:30-13:20>

Fun shopping for a new dress!
```

# Workflow<a id="sec-4"></a>

The basic idea would be to create a simple script which first downloads the ics file from Google (or wherever) and then calls this script to processes it. This script could then be added to a regular cron job to get updated calendar events each day (or however frequently you require).

An important point to remember is that when `cron` runs to execute tasks, it does not source your profile, so many environment settings. This means the directory containing the script may not be in your `PATH`. Either set it within your script or reference icsorg as a fully qualified path.

I do plan to add automatic retrieval of `.ics` files via a URL. Google calendar has a private URL which you can use to retrieve a dump of your calendar in ics format. It should be trivial to add this to the script.

# TODO Add support to retrieve ics file via URL<a id="sec-5"></a>
