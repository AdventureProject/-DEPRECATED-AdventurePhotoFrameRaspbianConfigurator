class Config
{
	constructor(config_dir, wpa_file)
	{
		this.config_dir_entry = config_dir;
		this.wpa_file_entry = wpa_file;
	}
}

var g_config = null;

function getStarted()
{
	console.log("Getting Started!");
	$('#step_1').fadeIn("slow");
}

function findDevices()
{
	console.log("finding devices...");
	
	var options = {
      type: 'openDirectory'
	}
	
	chrome.fileSystem.chooseEntry(options, onDeviceSelected);
}

function ssidChanged(e)
{
	var val = $(this).val();
	
	var val = $(this).val();
	handleTextInput( '#step_3', val );
}

function keyChanged(e)
{
	var val = $(this).val();
	handleTextInput( '#step_4', val );
}

function handleTextInput( elementId, val )
{
	if( $(elementId).is(":visible") )
	{
		if( val.length <= 0 )
		{
			$(elementId).fadeOut("slow");
		}
	}
	else
	{
		if( val.length > 0 )
		{
			$(elementId).delay('500').fadeIn("slow");
		}
	}
}

var errorHandler = function( fileError )
{
	console.log("FileError: ");
	console.log(fileError);
}

function onDeviceSelected( entry, files )
{
	console.log("Device selected: " + entry.name);
	
	var dirReader = entry.createReader();
	
	// Keep calling readEntries() until no more results are returned.
	var readEntries = function() {
		console.log("readEntries");
		dirReader.readEntries( function(results) {
			console.log("results: " + results.length);
			if( results.length )
			{
				var configFile = false;
				for( var file of results )
				{
					console.log("file: " + file);
					if( file.isFile && file.name == 'wpa_supplicant.conf' )
					{
						configFile = file;
					}
				}
				
				if( configFile !== false )
				{
					var config = new Config( entry, configFile );
					onConfigReady( config );
				}
			}
		}, errorHandler);
	};
	readEntries();
}

function onConfigReady( config )
{
	g_config = config;
	$('#step_2').fadeIn("slow");
}

function writeConfig()
{
	if( g_config )
	{
		g_config.wpa_file_entry.createWriter(function(writer) {
			writer.onerror = errorHandler;
			writer.onwriteend = function(e)
			{
				this.onwriteend = null;
				this.truncate(this.position);
				console.log('write complete.');
				
				$('#step_5').fadeIn("slow");
			};
			
			var ssid = $('#ssid').val();
			var key = $('#key').val();
			var security = 'WPA-PSK';

			var wpaContents = createWpaSupplicant( ssid, key, security );

			var parts = [];
			parts.push( wpaContents );

			var blob = new Blob(parts, {type : 'text/plain'});
			writer.write(blob,errorHandler);
		}, errorHandler);
	}
}

function createWpaSupplicant( ssid, password, security )
{
	var contents = WPA_TEMPLATE;
	contents = contents.replace('__SSID__',ssid);
	contents = contents.replace('__PASSWORD__',password);
	contents = contents.replace('__SECURITY__',security);
	return contents;
}

var WPA_TEMPLATE = 
'ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev\n\
update_config=1\n\
country=US\n\
\n\
network={\n\
        ssid="__SSID__"\n\
        psk="__PASSWORD__"\n\
        key_mgmt=__SECURITY__\n\
}';


$(document).ready(function() {
	$('#get_started').click(getStarted);
	$('#find_devices').click(findDevices);
	$('#ssid').on('input',ssidChanged);
	$('#key').on('input',keyChanged);
	$('#write_config').click(writeConfig);
});
