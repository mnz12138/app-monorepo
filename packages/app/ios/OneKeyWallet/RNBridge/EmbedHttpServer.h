#import <React/RCTBridgeModule.h>
#import "React/RCTBridge.h"
#import "React/RCTLog.h"
#import "React/RCTEventDispatcher.h"

#import "WGCDWebServer.h"
#import "WGCDWebServerDataResponse.h"
#import "WGCDWebServerDataRequest.h"
#import "WGCDWebServerPrivate.h"

// `RCTHttpServer` RCT prefixed is preserved by react-native
@interface EmbedHttpServer : NSObject <RCTBridgeModule> {
    WGCDWebServer* _webServer;
    NSMutableDictionary* _completionBlocks;
}
@end
