import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../../config/ps_colors.dart';

import '../../../../core/vendor/utils/utils.dart';

class PsWidgetWithAppBarAndBottomNavigation<T extends ChangeNotifier?>
    extends StatefulWidget {
  const PsWidgetWithAppBarAndBottomNavigation(
      {Key? key,
      required this.builder,
      required this.initProvider,
      required this.bottonNavigationView,
      this.child,
      this.onProviderReady,
      required this.appBarTitle})
      : super(key: key);

  final Widget Function(BuildContext context, T provider, Widget? child)
      builder;
  final Function initProvider;
  final Widget? child;
  final Function(T)? onProviderReady;
  final String appBarTitle;
  final Widget bottonNavigationView;

  @override
  _PsWidgetWithAppBarAndBottomNavigation<T> createState() =>
      _PsWidgetWithAppBarAndBottomNavigation<T>();
}

class _PsWidgetWithAppBarAndBottomNavigation<T extends ChangeNotifier?>
    extends State<PsWidgetWithAppBarAndBottomNavigation<T?>> {
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    // final dynamic data = EasyLocalizationProvider.of(context).data;
    // return EasyLocalizationProvider(
    //     data: data,
    //     child:

    return Scaffold(
        appBar: AppBar(
          systemOverlayStyle: SystemUiOverlayStyle(
            statusBarIconBrightness: Utils.getBrightnessForAppBar(context),
          ),
          iconTheme: IconThemeData(color: Theme.of(context).iconTheme.color),
          title: Text(widget.appBarTitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleLarge!.copyWith(
                  color: Utils.isLightMode(context)
                      ? PsColors.achromatic900
                      : PsColors.achromatic50,
                  fontWeight: FontWeight.bold)),
          flexibleSpace: Container(
            height: 200,
          ),
        ),
        bottomNavigationBar: widget.bottonNavigationView,
        body: ChangeNotifierProvider<T?>(
          lazy: false,
          create: (BuildContext context) {
            final T? providerObj = widget.initProvider();
            if (widget.onProviderReady != null) {
              widget.onProviderReady!(providerObj);
            }

            return providerObj;
          },
          child: Consumer<T>(
            builder: widget.builder,
            child: widget.child,
          ),
        )
        // )
        );
  }
}
