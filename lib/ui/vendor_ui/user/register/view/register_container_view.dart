import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../../config/ps_config.dart';
import '../../../../../core/vendor/provider/language/app_localization_provider.dart';

import '../../../../../core/vendor/provider/user/user_provider.dart';
import '../../../../../core/vendor/repository/user_repository.dart';
import '../../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../custom_ui/user/register/component/register_view.dart';
import '../../../common/ps_app_bar_widget.dart';

class RegisterContainerView extends StatefulWidget {
  @override
  _CityRegisterContainerViewState createState() =>
      _CityRegisterContainerViewState();
}

class _CityRegisterContainerViewState extends State<RegisterContainerView>
    with SingleTickerProviderStateMixin {
  AnimationController? animationController;
  @override
  void initState() {
    animationController =
        AnimationController(duration: PsConfig.animation_duration, vsync: this);
    super.initState();
  }

  @override
  void dispose() {
    animationController!.dispose();
    super.dispose();
  }

  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey<ScaffoldState>();
  UserProvider? userProvider;
  UserRepository? userRepo;

  @override
  Widget build(BuildContext context) {
    final PsValueHolder psValueHolder = Provider.of<PsValueHolder>(context);
    Future<bool> _requestPop() {
      if (psValueHolder.isForceLogin!) {
        return Future<bool>.value(true);
      }
      animationController!.reverse().then<dynamic>(
        (void data) {
          if (!mounted) {
            return Future<bool>.value(false);
          }
          Navigator.pop(context, true);
          return Future<bool>.value(true);
        },
      );
      return Future<bool>.value(false);
    }

    print(
        '............................Build UI Again ............................');
    userRepo = Provider.of<UserRepository>(context);
    return PopScope(
        canPop: false,
        onPopInvokedWithResult: (bool didPop, Object? dynamic) async {
          if (didPop) {
            return;
          }
          _requestPop();
        },
        child: Scaffold(
          body: CustomScrollView(
              scrollDirection: Axis.vertical,
              shrinkWrap: true,
              slivers: <Widget>[
                PsAppbarWidget(
                  appBarTitle: 'register__title'.tr,
                  useSliver: true,
                ),
                CustomRegisterView(
                  animationController: animationController,
                ),
              ]),
        ));
  }
}
